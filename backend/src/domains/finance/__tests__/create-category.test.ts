import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../../models/ExpenseCategory';
import { createCategory } from '../create-category';

jest.mock('../../../models/ExpenseCategory');

const mockedCreate = ExpenseCategory.create as jest.Mock;

describe('createCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreate.mockResolvedValue({ id: 9, name: 'Mantenimiento' });
  });

  it('creates the category active', async () => {
    await createCategory('Mantenimiento');

    expect(mockedCreate).toHaveBeenCalledWith(
      { name: 'Mantenimiento', active: true },
      expect.anything(),
    );
  });

  it('returns the created category', async () => {
    const result = await createCategory('Mantenimiento');

    expect(result).toEqual({ id: 9, name: 'Mantenimiento' });
  });

  it('joins the caller transaction when one is given', async () => {
    const transaction = {} as Transaction;

    await createCategory('Mantenimiento', transaction);

    expect(mockedCreate).toHaveBeenCalledWith(expect.any(Object), { transaction });
  });
});
