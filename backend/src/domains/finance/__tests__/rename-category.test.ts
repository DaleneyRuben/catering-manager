import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../../models/ExpenseCategory';
import { renameCategory } from '../rename-category';

jest.mock('../../../models/ExpenseCategory');

const mockedFindByPk = ExpenseCategory.findByPk as jest.Mock;

describe('renameCategory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renames the category', async () => {
    const update = jest.fn().mockResolvedValue({ id: 3, name: 'Insumos secos' });
    mockedFindByPk.mockResolvedValue({ update });

    const result = await renameCategory(3, 'Insumos secos');

    expect(update).toHaveBeenCalledWith({ name: 'Insumos secos' }, expect.anything());
    expect(result).toEqual({ id: 3, name: 'Insumos secos' });
  });

  // Renaming touches only the label: every expense already filed against this category keeps
  // pointing at the same row, and an archived category can be corrected without being restored.
  it('leaves the active flag alone', async () => {
    const update = jest.fn().mockResolvedValue({});
    mockedFindByPk.mockResolvedValue({ update });

    await renameCategory(3, 'Insumos secos');

    expect(update.mock.calls[0][0]).not.toHaveProperty('active');
  });

  it('returns null when the category does not exist', async () => {
    mockedFindByPk.mockResolvedValue(null);

    expect(await renameCategory(99, 'Insumos secos')).toBeNull();
  });

  it('joins the caller transaction when one is given', async () => {
    const update = jest.fn().mockResolvedValue({});
    mockedFindByPk.mockResolvedValue({ update });
    const transaction = {} as Transaction;

    await renameCategory(3, 'Insumos secos', transaction);

    expect(mockedFindByPk).toHaveBeenCalledWith(3, { transaction });
    expect(update).toHaveBeenCalledWith({ name: 'Insumos secos' }, { transaction });
  });
});
