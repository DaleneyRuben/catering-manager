import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ROLE_VALUES, type UserRole } from '../constants/roles.constants';

export type { UserRole };

@Table({ tableName: 'users', timestamps: true })
class User extends Model {
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare username: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.ENUM(...ROLE_VALUES), allowNull: false })
  declare role: UserRole;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastLoginAt: Date | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare lastDeviceType: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare lastOs: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare lastBrowser: string | null;
}

export default User;
