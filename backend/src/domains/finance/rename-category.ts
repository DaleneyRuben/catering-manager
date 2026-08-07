import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../models/ExpenseCategory';
import { ConflictError } from '../../utils/errors';
import { sameName } from './_helpers';

// Only the label moves. Expenses point at the category by id, so every one already filed keeps
// naming this row — including in a closed month, whose breakdown reads under the corrected name.
// An archived category can be renamed without being restored: fixing a typo is not a decision to
// start using it again.
//
// Unlike creating, a rename cannot fold onto the name it collides with: merging two categories
// would have to move every expense filed against one of them, which is a different operation from
// correcting a label — so this refuses rather than silently reassigning anyone's spending.
export const renameCategory = async (id: number, name: string, transaction?: Transaction) => {
  const category = await ExpenseCategory.findByPk(id, { transaction });
  if (!category) return null;

  // Matching itself is not a collision — recasing or re-accenting a category's own name is a
  // legitimate rename, and it is the row the fold finds first.
  const taken = await ExpenseCategory.findOne({ where: sameName(name), transaction });
  if (taken && taken.id !== id) throw new ConflictError('Ya existe una categoría con ese nombre');

  return category.update({ name }, { transaction });
};
