import Plan from '../../models/Plan';
import sequelize from '../../database/sequelize';
import planService from '../plan.service';

jest.mock('../../models/Plan');
jest.mock('../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockPlan = {
  id: 1,
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  description: 'Three meals a day',
  price: 150.0,
  discount: 0,
};

describe('planService.create', () => {
  it('creates a plan with valid data', async () => {
    (Plan.create as jest.Mock).mockResolvedValue(mockPlan);

    const result = await planService.create({
      name: 'Full Plan',
      meals: ['breakfast', 'lunch', 'dinner'],
      description: 'Three meals a day',
      price: 150.0,
      discount: 0,
    });

    expect(Plan.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'Full Plan', price: 150.0 });
  });

  it('propagates db errors', async () => {
    (Plan.create as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(
      planService.create({
        name: 'Full Plan',
        meals: ['breakfast'],
        description: '',
        price: 100,
        discount: 0,
      }),
    ).rejects.toThrow('db error');
  });
});

describe('planService.findAll', () => {
  it('returns all plans', async () => {
    (Plan.findAll as jest.Mock).mockResolvedValue([mockPlan]);

    const result = await planService.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Full Plan' });
  });
});

describe('planService.findById', () => {
  it('returns plan when found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockPlan);

    const result = await planService.findById(1);

    expect(result).toMatchObject({ id: 1, name: 'Full Plan' });
  });

  it('returns null when not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await planService.findById(999);

    expect(result).toBeNull();
  });
});

describe('planService.remove', () => {
  it('destroys the plan and returns true', async () => {
    const mockInstance = { destroy: jest.fn().mockResolvedValue(undefined) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    const result = await planService.remove(1);

    expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('returns false when plan not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await planService.remove(999);

    expect(result).toBe(false);
  });

  it('propagates db errors', async () => {
    const mockInstance = { destroy: jest.fn().mockRejectedValue(new Error('db error')) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(planService.remove(1)).rejects.toThrow('db error');
  });
});

describe('planService.update', () => {
  it('updates a plan and returns the updated instance', async () => {
    const updatedPlan = { ...mockPlan, name: 'Updated Plan' };
    const mockInstance = { update: jest.fn().mockResolvedValue(updatedPlan) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    const result = await planService.update(1, { name: 'Updated Plan' });

    expect(mockInstance.update).toHaveBeenCalledWith({ name: 'Updated Plan' });
    expect(result).toMatchObject({ name: 'Updated Plan' });
  });

  it('returns null when plan not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await planService.update(999, { name: 'Updated Plan' });

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    const mockInstance = { update: jest.fn().mockRejectedValue(new Error('db error')) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(planService.update(1, { name: 'Updated Plan' })).rejects.toThrow('db error');
  });
});

describe('planService.getClientCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a planId → count map as numbers', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      { planId: 1, count: '5' },
      { planId: 2, count: '3' },
    ]);

    const result = await planService.getClientCounts();

    expect(result).toEqual({ 1: 5, 2: 3 });
  });

  it('returns an empty object when no active clients exist', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([]);

    const result = await planService.getClientCounts();

    expect(result).toEqual({});
  });

  it('excludes finalized subscriptions from the count query', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([]);

    await planService.getClientCounts();

    const sql: string = (sequelize.query as jest.Mock).mock.calls[0][0];
    expect(sql).toContain('"finalizedAt" IS NULL');
  });

  it('propagates db errors', async () => {
    (sequelize.query as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(planService.getClientCounts()).rejects.toThrow('db error');
  });
});
