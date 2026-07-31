import Plan from '../../../models/Plan';
import { create } from '../create';

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

describe('create', () => {
  it('creates a plan with valid data', async () => {
    (Plan.create as jest.Mock).mockResolvedValue(mockPlan);

    const result = await create({
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
      create({ name: 'Full Plan', meals: ['breakfast'], price: 100, discount: 0 }),
    ).rejects.toThrow('db error');
  });
});
