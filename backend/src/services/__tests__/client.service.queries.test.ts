import { Op } from 'sequelize';
import Client from '../../models/Client';
import sequelize from '../../database/sequelize';
import clientService from '../client.service';
import deliveryGroupService from '../deliveryGroup.service';

jest.mock('../../models/Client');
jest.mock('../../models/ClientHistory');
jest.mock('../../models/Subscription');
jest.mock('../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../../utils/date', () => ({
  ...jest.requireActual('../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));
jest.mock('../deliveryGroup.service', () => ({
  __esModule: true,
  default: { findMembers: jest.fn() },
}));

const mockClient = {
  id: 1,
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: ['diabetes'],
  restrictions: ['gluten'],
  pausedSince: null,
};

describe('clientService.findAll', () => {
  it('returns rows and total', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [mockClient], count: 1 });

    const result = await clientService.findAll();

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ name: 'John Doe' });
    expect(result.total).toBe(1);
  });

  it('includes computed status in each row', async () => {
    const clientWithSub = {
      ...mockClient,
      subscriptions: [
        { startDate: '2026-01-01', contractEndDate: '2026-12-31', suspendedDates: [] },
      ],
    };
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [clientWithSub], count: 1 });

    const result = await clientService.findAll();

    expect(result.rows[0]).toMatchObject({ status: expect.any(String) });
  });

  it('sorts subscriptions newest-first so subscriptions[0] is the current one', async () => {
    const clientWithTwoSubs = {
      ...mockClient,
      subscriptions: [
        { id: 1, contractEndDate: '2026-05-01' },
        { id: 3, contractEndDate: '2026-08-01' },
        { id: 2, contractEndDate: '2026-07-01' },
      ],
    };
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({
      rows: [clientWithTwoSubs],
      count: 1,
    });

    const result = await clientService.findAll();

    const subs = (result.rows[0] as never as { subscriptions: { id: number }[] }).subscriptions;
    expect(subs[0].id).toBe(3);
    expect(subs[1].id).toBe(2);
    expect(subs[2].id).toBe(1);
  });
});

describe('clientService.findAll with filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('status=active filters by pausedSince IS NULL and requires subscription', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.where).toMatchObject({ pausedSince: { [Op.is]: null } });
    expect(call.include).toEqual(
      expect.arrayContaining([expect.objectContaining({ required: true })]),
    );
  });

  it('status=active excludes today-suspended clients via Op.and literal', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(andConditions.some((c: any) => c?.val?.includes?.('NOT IN'))).toBe(true);
  });

  it('status=active excludes clients whose subscription has not started yet', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    const futureStartExclusion = andConditions.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c?.val?.includes?.('startDate') && c?.val?.includes?.('NOT IN'),
    );
    expect(futureStartExclusion).toBe(true);
  });

  it('status=active uses contractEndDate >= today so contracts ending today are included', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.include[0].where).toMatchObject({
      contractEndDate: { [Op.gte]: expect.any(String) },
    });
  });

  it('status=paused uses contractEndDate >= today so plans ending today are included', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.include[0].where).toMatchObject({
      contractEndDate: { [Op.gte]: expect.any(String) },
    });
  });

  it('status=paused uses OR condition including pausedSince IS NOT NULL', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    const hasOr = andConditions.some(
      (c: unknown) => c !== null && typeof c === 'object' && Symbol.for('or') in (c as object),
    );
    expect(hasOr).toBe(true);
  });

  it('status=paused includes clients whose subscription has not started yet', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    const orCondition = andConditions?.find(
      (c: unknown) => c !== null && typeof c === 'object' && Symbol.for('or') in (c as object),
    );
    const orEntries = orCondition?.[Symbol.for('or')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasFutureStartEntry = orEntries?.some((c: any) => c?.val?.includes?.('startDate'));
    expect(hasFutureStartEntry).toBe(true);
  });

  it('status=ended uses left join (required:false)', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'ended' });

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([expect.objectContaining({ required: false })]),
      }),
    );
  });

  it('status=ended uses NOT EXISTS subquery with >= today so plans ending today are not included', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'ended' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notExistsLiteral = andConditions.find((c: any) => c?.val?.includes?.('NOT EXISTS'));
    expect(notExistsLiteral).toBeDefined();
    expect(notExistsLiteral.val).toContain('>=');
    expect(notExistsLiteral.val).toContain('"finalizedAt" IS NULL');
  });

  it('status=active excludes finalized subscriptions', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const subWhere = call.include?.[0]?.where;
    expect(subWhere?.finalizedAt).toEqual({ [Symbol.for('is')]: null });
  });

  it('status=expiring excludes today-suspended clients via Op.and literal', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'expiring' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    const suspendedExclusion = andConditions.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c?.val?.includes?.('suspendedDates') && c?.val?.includes?.('NOT IN'),
    );
    expect(suspendedExclusion).toBe(true);
  });

  it('status=expiring excludes finalized subscriptions', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'expiring' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const subWhere = call.include?.[0]?.where;
    expect(subWhere?.finalizedAt).toEqual({ [Symbol.for('is')]: null });
  });

  it('status=paused excludes finalized subscriptions', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const subWhere = call.include?.[0]?.where;
    expect(subWhere?.finalizedAt).toEqual({ [Symbol.for('is')]: null });
  });

  it('restriction filter adds a parameterized EXISTS/unnest condition', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ restriction: 'maní' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    const restrictionCondition = andConditions.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c?.val?.includes?.('unnest') && c?.val?.includes?.('restrictions'),
    );
    expect(restrictionCondition).toBeDefined();
    expect(restrictionCondition.val).toContain('ILIKE');
    expect(restrictionCondition.val).toContain(':restrictionTerm');
    expect(call.replacements).toEqual({ restrictionTerm: '%maní%' });
  });

  it('omits the restriction condition when no restriction filter is given', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ q: 'ana' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restrictionCondition = andConditions.find((c: any) => c?.val?.includes?.('unnest'));
    expect(restrictionCondition).toBeUndefined();
  });

  it('no filters calls findAndCountAll without where', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll();

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });

  it('returns rows and total from findAndCountAll', async () => {
    const mockClients = [{ id: 1, name: 'María García', pausedSince: null, subscriptions: [] }];
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: mockClients, count: 42 });

    const result = await clientService.findAll({ status: 'active' });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ id: 1, name: 'María García' });
    expect(result.total).toBe(42);
  });

  it('applies limit and offset from page and limit params', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ page: 3, limit: 10 });

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 }),
    );
  });

  it('defaults to page 1 and limit 20 when not provided', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll();

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 0 }),
    );
  });
});

describe('clientService.getCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns counts as numbers from string DB values', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      { active: '10', expiring: '5', paused: '3', ended: '2', total: '20' },
    ]);

    const result = await clientService.getCounts();

    expect(result).toEqual({ active: 10, expiring: 5, paused: 3, ended: 2, total: 20 });
  });

  it('propagates db errors', async () => {
    (sequelize.query as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(clientService.getCounts()).rejects.toThrow('db error');
  });
});

describe('clientService.findById', () => {
  it('returns client when found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);

    const result = await clientService.findById(1);

    expect(result).toMatchObject({ id: 1, name: 'John Doe' });
  });

  it('includes computed status in the response', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({
      ...mockClient,
      subscriptions: [
        { startDate: '2026-01-01', contractEndDate: '2026-12-31', suspendedDates: [] },
      ],
    });

    const result = await clientService.findById(1);

    expect(result).toMatchObject({ status: expect.any(String) });
  });

  it('returns null when not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await clientService.findById(999);

    expect(result).toBeNull();
  });

  it('includes empty groupMembers when client has no groupToken', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ ...mockClient, groupToken: null });

    const result = await clientService.findById(1);

    expect(result).toMatchObject({ groupMembers: [] });
    expect(deliveryGroupService.findMembers).not.toHaveBeenCalled();
  });

  it('includes groupMembers excluding self when client has a groupToken', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ ...mockClient, groupToken: 'tok-1' });
    (deliveryGroupService.findMembers as jest.Mock).mockResolvedValue([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Ana' },
    ]);

    const result = await clientService.findById(1);

    expect(deliveryGroupService.findMembers).toHaveBeenCalledWith('tok-1');
    expect(result).toMatchObject({ groupMembers: [{ id: 2, name: 'Ana' }] });
  });
});
