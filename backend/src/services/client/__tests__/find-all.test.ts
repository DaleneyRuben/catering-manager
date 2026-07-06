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

  it('applies limit and offset from page and limit params', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await findAll({ page: 3, limit: 10 });

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 }),
    );
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
