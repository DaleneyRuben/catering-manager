import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import Subscription from './Subscription';

@Table({ tableName: 'plans', timestamps: true })
class Plan extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  declare meals: string[];

  @Column({ type: DataType.TEXT })
  declare description: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @HasMany(() => Subscription)
  declare subscriptions: Subscription[];
}

export default Plan;
