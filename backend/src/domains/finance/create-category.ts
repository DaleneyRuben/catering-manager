import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../models/ExpenseCategory';
import { sameName } from './_helpers';

type CreatedCategory = { category: ExpenseCategory; created: boolean };

// A duplicate name is not an error. "+ Nueva" is a one-field form with no catalog in front of it,
// so typing a name that already exists is a routine mistake, and answering with a validation
// message would leave the user to go looking for a category they already described correctly.
// It resolves to the one they meant instead — and restores it if archived, since asking for a
// category by name is asking to file against it, and handing back a row they cannot use would
// read as the button doing nothing.
//
// created tells the caller whether anything was actually added, which is the difference between
// a 201 and a 200 and nothing more — either way the answer is the category to select.
export const createCategory = async (
  name: string,
  transaction?: Transaction,
): Promise<CreatedCategory> => {
  const existing = await ExpenseCategory.findOne({ where: sameName(name), transaction });

  if (!existing) {
    const category = await ExpenseCategory.create({ name, active: true }, { transaction });
    return { category, created: true };
  }

  if (!existing.active) await existing.update({ active: true }, { transaction });

  return { category: existing, created: false };
};
