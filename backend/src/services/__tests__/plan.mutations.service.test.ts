import Plan from '../../models/Plan';
import planMutationService from '../plan/mutations.service';

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

describe('planMutationService.create', () => {
  it('creates a plan with valid data', async () => {
    (Plan.create as jest.Mock).mockResolvedValue(mockPlan);

    const result = await planMutationService.create({
      name: 'Full Plan',
      meals: ['breakfast', 'lunch', 'dinner'],
      price: 150.0,
      discount: 0,
    });

    expect(Plan.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'Full Plan', price: 150.0 });
  });

  it('propagates db errors', async () => {
    (Plan.create as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(
      planMutationService.create({
        name: 'Full Plan',
        meals: ['breakfast'],
        price: 100,
        discount: 0,
      }),
    ).rejects.toThrow('db error');
  });
});

describe('planMutationService.update', () => {
  it('updates a plan and returns the updated instance', async () => {
    const updatedPlan = { ...mockPlan, name: 'Updated Plan' };
    const mockInstance = { update: jest.fn().mockResolvedValue(updatedPlan) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    const result = await planMutationService.update(1, { name: 'Updated Plan' });

    expect(mockInstance.update).toHaveBeenCalledWith({ name: 'Updated Plan' });
    expect(result).toMatchObject({ name: 'Updated Plan' });
  });

  it('returns null when plan not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await planMutationService.update(999, { name: 'Updated Plan' });

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    const mockInstance = { update: jest.fn().mockRejectedValue(new Error('db error')) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(planMutationService.update(1, { name: 'Updated Plan' })).rejects.toThrow(
      'db error',
    );
  });
});

describe('planMutationService.remove', () => {
  it('destroys the plan and returns true', async () => {
    const mockInstance = { destroy: jest.fn().mockResolvedValue(undefined) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    const result = await planMutationService.remove(1);

    expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('returns false when plan not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await planMutationService.remove(999);

    expect(result).toBe(false);
  });

  it('propagates db errors', async () => {
    const mockInstance = { destroy: jest.fn().mockRejectedValue(new Error('db error')) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(planMutationService.remove(1)).rejects.toThrow('db error');
  });
});
