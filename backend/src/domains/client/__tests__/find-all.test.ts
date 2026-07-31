import { Op } from 'sequelize';
import Client from '../../../models/Client';
import { findAll } from '../find-all';

jest.mock('../../../models/Client');
jest.mock('../../../models/Subscription');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));

const mockClient = {
  id: 1,
  name: 'John Doe',
  pausedSince: null,
  subscriptions: [],
};

describe('findAll', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns rows and total', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [mockClient], count: 1 });

    const result = await findAll();

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ name: 'John Doe' });
    expect(result.total).toBe(1);
  });

  it('status=active filters by pausedSince IS NULL and requires subscription', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.where).toMatchObject({ pausedSince: { [Op.is]: null } });
    expect(call.include).toEqual(
      expect.arrayContaining([expect.objectContaining({ required: true })]),
    );
  });

  it('status=ended uses left join (required:false)', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ status: 'ended' });

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([expect.objectContaining({ required: false })]),
      }),
    );
  });

  it('restriction filter adds a parameterized EXISTS/unnest condition', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ restriction: 'maní' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restrictionCondition = andConditions.find((c: any) => c?.val?.includes?.('unnest'));
    expect(restrictionCondition).toBeDefined();
    expect(call.replacements).toEqual({ restrictionTerm: '%maní%' });
  });

  it('escapes %, _, and \\ in the q filter so they are matched literally, not as wildcards', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ q: '50%_off\\x' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qCondition = andConditions.find((c: any) => c?.[Op.or]);
    expect(qCondition[Op.or]).toEqual([
      { name: { [Op.iLike]: '%50\\%\\_off\\\\x%' } },
      { address: { [Op.iLike]: '%50\\%\\_off\\\\x%' } },
      { nit: { [Op.iLike]: '%50\\%\\_off\\\\x%' } },
    ]);
  });

  it('escapes %, _, and \\ in the restriction filter so they are matched literally', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ restriction: '50%_off\\x' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.replacements).toEqual({ restrictionTerm: '%50\\%\\_off\\\\x%' });
  });

  it('applies limit and offset from page and limit params', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ page: 3, limit: 10 });

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 }),
    );
  });

  it('excludes clients whose latest subscription is unpaid, with no status filter', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll();

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paidCondition = andConditions?.find((c: any) => c?.val?.includes?.('ps."paid" = false'));
    expect(paidCondition).toBeDefined();
  });

  it('only excludes a client when the unpaid subscription is their sole subscription', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll();

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paidCondition = andConditions?.find((c: any) => c?.val?.includes?.('ps."paid" = false'));
    // The old (buggy) guard picked the row with MAX(id) regardless of how many subscriptions
    // the client has, so a client with a paid active subscription plus a newer unpaid
    // renewal was excluded too. The fix must scope the exclusion to sole-subscription clients.
    expect(paidCondition.val).not.toMatch(/MAX\(id\)/);
    expect(paidCondition.val).toMatch(/COUNT\(\*\)/);
  });

  it.each(['active', 'expiring', 'paused', 'ended'])(
    'excludes clients whose latest subscription is unpaid for status=%s',
    async (status) => {
      (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      await findAll({ status });

      const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
      const andConditions = call.where?.[Symbol.for('and')];
      const paidCondition = andConditions?.find((c: { val?: string }) =>
        c?.val?.includes?.('ps."paid" = false'),
      );
      expect(paidCondition).toBeDefined();
    },
  );

  it.each(['active', 'expiring'])(
    'status=%s keeps a client whose running plan covers today despite a future renewal',
    async (status) => {
      (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      await findAll({ status });

      const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
      const andConditions = call.where?.[Symbol.for('and')];
      const futureCondition = andConditions?.find((c: { val?: string }) =>
        c?.val?.includes?.('"startDate" > '),
      );
      expect(futureCondition.val).toContain('"startDate" <= ');
    },
  );

  it('status=expiring returns the queued renewal alongside the expiring subscription', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ status: 'expiring' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    // the renewal ends beyond the expiry window, so constraining the join would drop it
    expect(call.include[0].where?.contractEndDate).toBeUndefined();
    const andConditions = call.where?.[Symbol.for('and')];
    const expiringCondition = andConditions?.find((c: { val?: string }) =>
      c?.val?.includes?.('"contractEndDate" BETWEEN'),
    );
    expect(expiringCondition).toBeDefined();
  });

  it('status=paused does not catch a client whose running plan covers today', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    const orCondition = andConditions?.find((c: Record<symbol, unknown>) => c?.[Symbol.for('or')]);
    const branches = orCondition[Symbol.for('or')] as { val?: string }[];
    const futureBranch = branches.find((c) => c?.val?.includes?.('"startDate" > '));
    expect(futureBranch?.val).toContain('"startDate" <= ');
  });

  it('orders results by createdAt ascending, oldest first', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll();

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [['createdAt', 'ASC']] }),
    );
  });

  it('defaults to page 1 and limit 25', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll();

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 0 }),
    );
  });
});
