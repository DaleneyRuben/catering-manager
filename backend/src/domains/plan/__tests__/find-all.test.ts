import Plan from '../../../models/Plan';
import { findAll } from '../find-all';

jest.mock('../../../models/Plan');

const mockPlan = {
  id: 1,
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  price: 150.0,
};

describe('findAll', () => {
  it('returns all plans', async () => {
    (Plan.findAll as jest.Mock).mockResolvedValue([mockPlan]);

    const result = await findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Full Plan' });
  });

  it('orders plans by price ascending', async () => {
    (Plan.findAll as jest.Mock).mockResolvedValue([mockPlan]);

    await findAll();

    expect(Plan.findAll).toHaveBeenCalledWith({ order: [['price', 'ASC']] });
  });
});
