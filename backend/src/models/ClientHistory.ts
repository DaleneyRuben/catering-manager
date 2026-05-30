import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from './Client';

export type HistoryEventType =
  | 'paused'
  | 'resumed'
  | 'plan_assigned'
  | 'plan_changed'
  | 'suspended'
  | 'reactivated'
  | 'finalized';

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
}

export default ClientHistory;
