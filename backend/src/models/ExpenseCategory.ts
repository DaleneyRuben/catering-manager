import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import Expense from './Expense';

@Table({ tableName: 'expense_categories', timestamps: true })
class ExpenseCategory extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @HasMany(() => Expense)
  declare expenses: Expense[];
}

export default ExpenseCategory;
