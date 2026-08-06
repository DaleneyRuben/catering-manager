import type { Transaction } from 'sequelize';
import Expense from '../../models/Expense';

// Soft delete — Expense is paranoid, as Client is. The row stays so a closed month's totals can
// still be reconstructed from what was actually recorded at the time.
export const deleteExpense = async (id: number, transaction?: Transaction): Promise<boolean> => {
  const expense = await Expense.findByPk(id, { transaction });
  if (!expense) return false;

  await expense.destroy({ transaction });
  return true;
};
