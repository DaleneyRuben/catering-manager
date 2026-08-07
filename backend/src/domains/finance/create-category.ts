import type { Transaction } from 'sequelize';
import ExpenseCategory from '../../models/ExpenseCategory';

export const createCategory = (name: string, transaction?: Transaction) =>
  ExpenseCategory.create({ name, active: true }, { transaction });
