import type { Transaction } from 'sequelize';
import type { Actor } from '../../types/actor';

export type HistoryEvent =
  | { type: 'paused' | 'resumed' | 'finalized' | 'deleted'; clientId: number }
  | { type: 'suspended'; clientId: number; metadata: { dates: string[] } };

export const record = async (
  _actor: Actor,
  _event: HistoryEvent,
  _transaction?: Transaction,
): Promise<void> => Promise.resolve();
