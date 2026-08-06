import type { Transaction } from 'sequelize';
import Expense from '../../../models/Expense';
import { deleteExpense } from '../delete-expense';

jest.mock('../../../models/Expense');

const mockedFindByPk = Expense.findByPk as jest.Mock;

describe('deleteExpense', () => {
  beforeEach(() => jest.clearAllMocks());

  it('soft-deletes the expense so historical totals keep their row', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    mockedFindByPk.mockResolvedValue({ destroy });

    await deleteExpense(1);

    expect(destroy).toHaveBeenCalled();
  });

  it('reports success when the expense was deleted', async () => {
    mockedFindByPk.mockResolvedValue({ destroy: jest.fn().mockResolvedValue(undefined) });

    const result = await deleteExpense(1);

    expect(result).toBe(true);
  });

  it('reports failure when the expense does not exist', async () => {
    mockedFindByPk.mockResolvedValue(null);

    const result = await deleteExpense(99);

    expect(result).toBe(false);
  });

  it('joins the caller transaction when one is given', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    mockedFindByPk.mockResolvedValue({ destroy });
    const transaction = {} as Transaction;

    await deleteExpense(1, transaction);

    expect(mockedFindByPk).toHaveBeenCalledWith(1, { transaction });
    expect(destroy).toHaveBeenCalledWith({ transaction });
  });
});
