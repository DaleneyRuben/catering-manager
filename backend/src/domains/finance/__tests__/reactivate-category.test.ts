import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../../models/ExpenseCategory';
import { reactivateCategory } from '../reactivate-category';

jest.mock('../../../models/ExpenseCategory');

const mockedFindByPk = ExpenseCategory.findByPk as jest.Mock;

describe('reactivateCategory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('puts the category back in use', async () => {
    const update = jest.fn().mockResolvedValue({ id: 3, active: true });
    mockedFindByPk.mockResolvedValue({ update });

    const result = await reactivateCategory(3);

    expect(update).toHaveBeenCalledWith({ active: true }, expect.anything());
    expect(result).toEqual({ id: 3, active: true });
  });

  // Archiving never destroyed the row, so restoring is only the flag moving back — the expenses
  // filed against it while it was archived were never orphaned and need no repair.
  it('leaves the name alone', async () => {
    const update = jest.fn().mockResolvedValue({});
    mockedFindByPk.mockResolvedValue({ update });

    await reactivateCategory(3);

    expect(update.mock.calls[0][0]).not.toHaveProperty('name');
  });

  it('returns null when the category does not exist', async () => {
    mockedFindByPk.mockResolvedValue(null);

    expect(await reactivateCategory(99)).toBeNull();
  });

  it('joins the caller transaction when one is given', async () => {
    const update = jest.fn().mockResolvedValue({});
    mockedFindByPk.mockResolvedValue({ update });
    const transaction = {} as Transaction;

    await reactivateCategory(3, transaction);

    expect(mockedFindByPk).toHaveBeenCalledWith(3, { transaction });
    expect(update).toHaveBeenCalledWith({ active: true }, { transaction });
  });
});
