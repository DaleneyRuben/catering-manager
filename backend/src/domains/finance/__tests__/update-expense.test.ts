import type { Transaction } from 'sequelize';
import Expense from '../../../models/Expense';
import { updateExpense } from '../update-expense';

jest.mock('../../../models/Expense');

const mockedFindByPk = Expense.findByPk as jest.Mock;

describe('updateExpense', () => {
  beforeEach(() => jest.clearAllMocks());

  it('applies the changed fields to the expense', async () => {
    const update = jest.fn().mockResolvedValue({ id: 1, amount: 300 });
    mockedFindByPk.mockResolvedValue({ update });

    await updateExpense(1, { amount: 300 });

    expect(update).toHaveBeenCalledWith({ amount: 300 }, expect.anything());
  });

  it('returns the updated expense', async () => {
    const updated = { id: 1, amount: 300 };
    mockedFindByPk.mockResolvedValue({ update: jest.fn().mockResolvedValue(updated) });

    const result = await updateExpense(1, { amount: 300 });

    expect(result).toEqual(updated);
  });

  it('returns null when the expense does not exist', async () => {
    mockedFindByPk.mockResolvedValue(null);

    const result = await updateExpense(99, { amount: 300 });

    expect(result).toBeNull();
  });

  it('joins the caller transaction when one is given', async () => {
    const update = jest.fn().mockResolvedValue({});
    mockedFindByPk.mockResolvedValue({ update });
    const transaction = {} as Transaction;

    await updateExpense(1, { amount: 300 }, transaction);

    expect(mockedFindByPk).toHaveBeenCalledWith(1, { transaction });
    expect(update).toHaveBeenCalledWith({ amount: 300 }, { transaction });
  });
});
