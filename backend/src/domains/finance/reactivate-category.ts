import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../models/ExpenseCategory';

// The mirror of deactivateCategory. Archiving only ever set a flag — the row and every expense
// filed against it stayed exactly where they were — so restoring is that flag moving back, with
// nothing to repair and no name to restore.
export const reactivateCategory = async (id: number, transaction?: Transaction) => {
  const category = await ExpenseCategory.findByPk(id, { transaction });
  if (!category) return null;

  return category.update({ active: true }, { transaction });
};
