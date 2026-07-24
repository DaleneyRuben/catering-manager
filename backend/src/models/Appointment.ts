import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
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

  @ForeignKey(() => Subscription)
  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: null })
  declare subscriptionId: number | null;

  @BelongsTo(() => Subscription)
  declare subscription: Subscription;
}

export default Appointment;
