import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from './Client';
import Subscription from './Subscription';
import User from './User';

// Not paranoid: a Payment is never deleted, only corrected via finance.adjustPayment (see
// ADR-008). subscriptionId is nullable with ON DELETE SET NULL so a payment outlives a deleted
// subscription — the business takes no refunds, so it still counts toward income.
@Table({ tableName: 'payments', timestamps: true })
class Payment extends Model {
  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @BelongsTo(() => Client)
  declare client: Client;

  @ForeignKey(() => Subscription)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare subscriptionId: number | null;

  @BelongsTo(() => Subscription)
  declare subscription: Subscription;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amount: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare paidAt: string;

  // ON DELETE SET NULL, not the CASCADE used by login_events.userId: User is hard-deleted, so a
  // cascade here would erase a month of payments along with the admin who entered them.
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare registeredBy: number | null;

  @BelongsTo(() => User)
  declare registeredByUser: User;
}

export default Payment;
