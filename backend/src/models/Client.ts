import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import ClientHistory from './ClientHistory';
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
  declare zone: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare delivery: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare nit: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare businessName: string | null;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  declare underlyingDiseases: string[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  declare restrictions: string[];

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @HasMany(() => Subscription)
  declare subscriptions: Subscription[];

  @HasMany(() => ClientHistory)
  declare history: ClientHistory[];
}

export default Client;
