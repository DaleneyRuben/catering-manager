import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import ExpenseCategory from './ExpenseCategory';
import User from './User';

@Table({ tableName: 'expenses', timestamps: true, paranoid: true })
class Expense extends Model {
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amount: number;

  @ForeignKey(() => ExpenseCategory)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare categoryId: number;

  @BelongsTo(() => ExpenseCategory)
  declare category: ExpenseCategory;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare spentAt: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare description: string | null;

  // ON DELETE SET NULL, not the CASCADE used by login_events.userId: User is hard-deleted, so a
  // cascade here would erase a month of expenses along with the admin who entered them.
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare registeredBy: number | null;

  @BelongsTo(() => User)
  declare registeredByUser: User;
}

export default Expense;
