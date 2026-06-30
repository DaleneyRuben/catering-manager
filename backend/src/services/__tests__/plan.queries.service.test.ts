import Plan from '../../models/Plan';
import sequelize from '../../database/sequelize';
import planQueryService from '../plan/queries.service';

jest.mock('../../models/Plan');
jest.mock('../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockPlan = {
  id: 1,
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  price: 150.0,
};

describe('planQueryService.findAll', () => {
  it('returns all plans', async () => {
    (Plan.findAll as jest.Mock).mockResolvedValue([mockPlan]);

    const result = await planQueryService.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Full Plan' });
  });

  it('orders plans by price ascending', async () => {
    (Plan.findAll as jest.Mock).mockResolvedValue([mockPlan]);

    await planQueryService.findAll();

    expect(Plan.findAll).toHaveBeenCalledWith({ order: [['price', 'ASC']] });
  });
});

describe('planQueryService.findById', () => {
  it('returns plan when found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockPlan);

    const result = await planQueryService.findById(1);

    expect(result).toMatchObject({ id: 1, name: 'Full Plan' });
  });

  it('returns null when not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await planQueryService.findById(999);

    expect(result).toBeNull();
  });
});

describe('planQueryService.getClientCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a planId → count map as numbers', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      { planId: 1, count: '5' },
      { planId: 2, count: '3' },
    ]);

    const result = await planQueryService.getClientCounts();

    expect(result).toEqual({ 1: 5, 2: 3 });
  });

  it('returns an empty object when no active clients exist', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([]);

    const result = await planQueryService.getClientCounts();

    expect(result).toEqual({});
  });

  it('excludes finalized subscriptions from the count query', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([]);

    await planQueryService.getClientCounts();

    const sql: string = (sequelize.query as jest.Mock).mock.calls[0][0];
    expect(sql).toContain('"finalizedAt" IS NULL');
  });

  it('propagates db errors', async () => {
    (sequelize.query as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(planQueryService.getClientCounts()).rejects.toThrow('db error');
  });
});
