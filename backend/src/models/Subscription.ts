import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from './Client';
import Plan from './Plan';

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

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare contractDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare startDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare contractEndDate: string;
}

export default Subscription;
