import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import type { HistoryEventType } from '../constants/history.constants';
import Client from './Client';
import User from './User';

@Table({ tableName: 'client_history', timestamps: false })
class ClientHistory extends Model {
  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @BelongsTo(() => Client)
  declare client: Client;

  @Column({ type: DataType.STRING, allowNull: false })
  declare eventType: HistoryEventType;

  @Column({ type: DataType.DATE, allowNull: false })
  declare occurredAt: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare metadata: Record<string, unknown>;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare userId: number | null;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.STRING, allowNull: true })
  declare username: string | null;
}

export default ClientHistory;
