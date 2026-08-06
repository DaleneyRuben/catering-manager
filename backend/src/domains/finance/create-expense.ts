import type { Transaction } from 'sequelize';
import Expense from '../../models/Expense';
import type { Actor } from '../../types/actor';

type ExpenseData = {
  amount: number;
  categoryId: number;
  spentAt: string;
  description?: string | null;
};

export const createExpense = (data: ExpenseData, actor: Actor, transaction?: Transaction) =>
  Expense.create(
    {
      amount: data.amount,
      categoryId: data.categoryId,
      spentAt: data.spentAt,
      description: data.description ?? null,
      registeredBy: actor.userId,
    },
    { transaction },
  );
