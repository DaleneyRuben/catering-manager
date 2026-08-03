import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from './Client';
import Subscription from './Subscription';

@Table({ tableName: 'appointments', timestamps: true })
class Appointment extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare phone: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare time: string;

  // ON DELETE SET NULL is load-bearing, not incidental: deleting a renewal that resolved an
  // appointment has to clear this link, and subscription cannot write it — evaluation owns the
  // table. See docs/adr/007-domain-ownership.md.
  @ForeignKey(() => Subscription)
  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: null })
  declare subscriptionId: number | null;

  @BelongsTo(() => Subscription)
  declare subscription: Subscription;

  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: null })
  declare clientId: number | null;

  @BelongsTo(() => Client)
  declare client: Client;
}

export default Appointment;
