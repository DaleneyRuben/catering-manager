import Plan from '../../../models/Plan';
import { update } from '../update';

jest.mock('../../../models/Plan');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockPlan = {
  id: 1,
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  price: 150.0,
};

describe('update', () => {
  it('updates a plan and returns the updated instance', async () => {
    const updatedPlan = { ...mockPlan, name: 'Updated Plan' };
    const mockInstance = { update: jest.fn().mockResolvedValue(updatedPlan) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    const result = await update(1, { name: 'Updated Plan' });

    expect(mockInstance.update).toHaveBeenCalledWith({ name: 'Updated Plan' });
    expect(result).toMatchObject({ name: 'Updated Plan' });
  });

  it('returns null when plan not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await update(999, { name: 'Updated Plan' });

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    const mockInstance = { update: jest.fn().mockRejectedValue(new Error('db error')) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(update(1, { name: 'Updated Plan' })).rejects.toThrow('db error');
  });
});
