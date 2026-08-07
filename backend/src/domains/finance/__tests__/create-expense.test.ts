import type { Transaction } from 'sequelize';
import Expense from '../../../models/Expense';
import type { Actor } from '../../../types/actor';
import { createExpense } from '../create-expense';

jest.mock('../../../models/Expense');

const mockedCreate = Expense.create as jest.Mock;

const actor: Actor = { userId: 7, username: 'Silvia' };

const data = {
  amount: 250,
  categoryId: 3,
  spentAt: '2026-08-05',
  description: 'Verduras del mercado',
};

describe('createExpense', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreate.mockResolvedValue({ id: 1 });
  });

  it('stores the amount, category and date the money left', async () => {
    await createExpense(data, actor);

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250, categoryId: 3, spentAt: '2026-08-05' }),
      expect.anything(),
    );
  });

  it('stamps the acting user as the one who registered it', async () => {
    await createExpense(data, actor);

    expect(mockedCreate.mock.calls[0][0].registeredBy).toBe(7);
  });

  it('stores a null description when none is given', async () => {
    await createExpense({ amount: 250, categoryId: 3, spentAt: '2026-08-05' }, actor);

    expect(mockedCreate.mock.calls[0][0].description).toBeNull();
  });

  it('returns the created expense', async () => {
    mockedCreate.mockResolvedValue({ id: 12 });

    const result = await createExpense(data, actor);

    expect(result).toEqual({ id: 12 });
  });

  it('joins the caller transaction when one is given', async () => {
    const transaction = {} as Transaction;

    await createExpense(data, actor, transaction);

    expect(mockedCreate).toHaveBeenCalledWith(expect.any(Object), { transaction });
  });
});
