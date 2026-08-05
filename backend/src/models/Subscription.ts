import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from './Client';
import Plan from './Plan';

// not paranoid, unlike Client: a subscription is only ever deleted when it should never have
// existed (an abandoned unpaid resolution, a renewal registered by mistake), and client_history
// keeps the record. Leaving rows behind would also skew client/find-all.ts, which counts
// subscriptions through raw subqueries that no deletedAt scope applies to.
@Table({ tableName: 'subscriptions', timestamps: true })
class Subscription extends Model {
  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @BelongsTo(() => Client)
  declare client: Client;

  @ForeignKey(() => Plan)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare planId: number;

  @BelongsTo(() => Plan)
  declare plan: Plan;

  // The agreed total for this contract, frozen when it was agreed. Not derived from the plan:
  // a plan's price is quoted for 20 delivery days and a longer contract is negotiated upward, so
  // this may sit either side of plan.price. The plan supplies only the default the admin edits.
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 20 })
  declare duration: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare contractDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare startDate: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare contractEndDate: string | null;

  @Column({ type: DataType.ARRAY(DataType.DATEONLY), allowNull: false, defaultValue: [] })
  declare suspendedDates: string[];

  @Column({ type: DataType.DATEONLY, allowNull: true, defaultValue: null })
  declare finalizedAt: string | null;

  // Set on the plan that is paused, never on the client: a client may hold a running plan and a
  // "sin fecha" renewal at once, and only the renewal is paused.
  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare pausedSince: Date | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare specialInstructions: Record<string, string>;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare paid: boolean;

  @Column({ type: DataType.ENUM('renewal', 'reactivation'), allowNull: true })
  declare renewalType: 'renewal' | 'reactivation' | null;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: null })
  declare appointmentId: number | null;
}

export default Subscription;
