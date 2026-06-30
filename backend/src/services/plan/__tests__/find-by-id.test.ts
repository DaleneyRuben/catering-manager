import Plan from '../../../models/Plan';
import { findById } from '../find-by-id';

jest.mock('../../../models/Plan');

const mockPlan = {
  id: 1,
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  price: 150.0,
};

describe('findById', () => {
  it('returns plan when found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockPlan);

    const result = await findById(1);

    expect(result).toMatchObject({ id: 1, name: 'Full Plan' });
  });

  it('returns null when not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await findById(999);

    expect(result).toBeNull();
  });
});
