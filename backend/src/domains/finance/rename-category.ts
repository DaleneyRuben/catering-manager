import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../models/ExpenseCategory';

// Only the label moves. Expenses point at the category by id, so every one already filed keeps
// naming this row — including in a closed month, whose breakdown reads under the corrected name.
// An archived category can be renamed without being restored: fixing a typo is not a decision to
// start using it again.
export const renameCategory = async (id: number, name: string, transaction?: Transaction) => {
  const category = await ExpenseCategory.findByPk(id, { transaction });
  if (!category) return null;

  return category.update({ name }, { transaction });
};
