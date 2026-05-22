import Plan from '../../models/Plan';
import planService from '../plan.service';

jest.mock('../../models/Plan');

const mockPlan = {
  id: 1,
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  description: 'Three meals a day',
};

describe('planService.create', () => {
  it('creates a plan with valid data', async () => {
    (Plan.create as jest.Mock).mockResolvedValue(mockPlan);

    const result = await planService.create({
      name: 'Full Plan',
      meals: ['breakfast', 'lunch', 'dinner'],
      description: 'Three meals a day',
    });

    expect(Plan.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'Full Plan', meals: ['breakfast', 'lunch', 'dinner'] });
  });

  it('propagates db errors', async () => {
    (Plan.create as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(
      planService.create({ name: 'Full Plan', meals: ['breakfast'], description: '' }),
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
