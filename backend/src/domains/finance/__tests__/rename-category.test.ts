import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../../models/ExpenseCategory';
import { ConflictError } from '../../../utils/errors';
import { renameCategory } from '../rename-category';

jest.mock('../../../models/ExpenseCategory');

const mockedFindByPk = ExpenseCategory.findByPk as jest.Mock;
const mockedFindOne = ExpenseCategory.findOne as jest.Mock;

describe('renameCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFindOne.mockResolvedValue(null);
  });

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

  // Unlike creating, a rename cannot fold: merging two categories would have to move every
  // expense filed against one of them, which is a different operation from correcting a label.
  it('refuses a name another category already holds', async () => {
    mockedFindByPk.mockResolvedValue({ id: 3, update: jest.fn() });
    mockedFindOne.mockResolvedValue({ id: 8, name: 'Transporte' });

    await expect(renameCategory(3, 'transporte')).rejects.toBeInstanceOf(ConflictError);
  });

  it('allows a category to keep its own name', async () => {
    const update = jest.fn().mockResolvedValue({ id: 3, name: 'Transporte' });
    mockedFindByPk.mockResolvedValue({ id: 3, update });
    mockedFindOne.mockResolvedValue({ id: 3, name: 'Transporte' });

    await expect(renameCategory(3, 'Transporte')).resolves.toBeTruthy();
    expect(update).toHaveBeenCalled();
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
