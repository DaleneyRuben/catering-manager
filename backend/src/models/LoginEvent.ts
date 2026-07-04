import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from './User';

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

@Table({ tableName: 'login_events', timestamps: true, updatedAt: false })
class LoginEvent extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.STRING, allowNull: true })
  declare deviceType: DeviceType | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare os: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare browser: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare userAgent: string | null;
}

export default LoginEvent;
