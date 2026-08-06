import type { Transaction } from 'sequelize';
import Expense from '../../models/Expense';

type ExpenseChanges = {
  amount?: number;
  categoryId?: number;
  spentAt?: string;
  description?: string | null;
};

export const updateExpense = async (
  id: number,
  changes: ExpenseChanges,
  transaction?: Transaction,
) => {
  const expense = await Expense.findByPk(id, { transaction });
  if (!expense) return null;

  return expense.update(changes, { transaction });
};
