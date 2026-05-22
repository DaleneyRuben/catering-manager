import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import Subscription from './Subscription';

@Table({ tableName: 'clients', timestamps: true })
class Client extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare sex: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare dateOfBirth: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare phoneNumber: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare address: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare deliveryZone: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  declare underlyingDiseases: string[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  declare allergies: string[];

  @HasMany(() => Subscription)
  declare subscriptions: Subscription[];
}

export default Client;
