import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type UserRole = 'admin' | 'manager' | 'delivery';

@Table({ tableName: 'users', timestamps: true })
class User extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare username: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.ENUM('admin', 'manager', 'delivery'), allowNull: false })
  declare role: UserRole;
}

export default User;
