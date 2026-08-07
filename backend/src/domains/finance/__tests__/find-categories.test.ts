import ExpenseCategory from '../../../models/ExpenseCategory';
import { findCategories } from '../find-categories';

jest.mock('../../../models/ExpenseCategory');

const mockedFindAll = ExpenseCategory.findAll as jest.Mock;

describe('findCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFindAll.mockResolvedValue([]);
  });

  it('returns only the categories still in use', async () => {
    await findCategories();

    expect(mockedFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
  });

  it('includes deactivated categories when asked, so past expenses can name theirs', async () => {
    await findCategories({ includeInactive: true });

    expect(mockedFindAll.mock.calls[0][0].where).toBeUndefined();
  });

  it('orders categories by name', async () => {
    await findCategories();

    expect(mockedFindAll.mock.calls[0][0].order).toEqual([['name', 'ASC']]);
  });

  it('returns the rows it found', async () => {
    const rows = [{ id: 1, name: 'Insumos' }];
    mockedFindAll.mockResolvedValue(rows);

    const result = await findCategories();

    expect(result).toEqual(rows);
  });
});
