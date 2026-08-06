import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../models/ExpenseCategory';

// Deactivated, never destroyed: expenses already filed against a category must keep naming it, or
// a closed month's per-category breakdown loses a line.
export const deactivateCategory = async (id: number, transaction?: Transaction) => {
  const category = await ExpenseCategory.findByPk(id, { transaction });
  if (!category) return null;

  return category.update({ active: false }, { transaction });
};
