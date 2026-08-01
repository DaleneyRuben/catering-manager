import type { Transaction } from 'sequelize';
import ClientHistory from '../../models/ClientHistory';
import type { Actor } from '../../types/actor';

// The plan fields are optional because plan_assigned covers two situations: a plan being put in
// place, which records the plan and its price, and a later edit to the start date or duration,
// which records only the new dates. Splitting them into two event types is tracked separately.
type PlanEventMetadata = {
  startDate: string | null;
  duration: number;
  contractEndDate: string | null;
  planId?: number;
  planName?: string | null;
  planPrice?: number | null;
  discount?: number;
  appointmentId?: number;
};

type RenewalDeletedMetadata = {
  planId: number;
  planName: string | null;
  startDate: string | null;
  contractEndDate: string | null;
  duration: number;
  discount: number;
  registeredAt: Date;
};

export type HistoryEvent =
  | {
      type: 'plan_assigned' | 'plan_renewed' | 'reactivated';
      clientId: number;
      metadata: PlanEventMetadata;
    }
  | { type: 'renewal_deleted'; clientId: number; metadata: RenewalDeletedMetadata }
  | { type: 'suspended'; clientId: number; metadata: { dates: string[] } }
  | { type: 'paused' | 'resumed' | 'finalized' | 'deleted'; clientId: number };

// The only writer of client_history. History is append-only, so there is no update or delete
// counterpart: rows are removed only when their client is, by the cascade on the foreign key.
export const record = async (
  actor: Actor,
  event: HistoryEvent,
  transaction?: Transaction,
): Promise<void> => {
  const row = {
    clientId: event.clientId,
    eventType: event.type,
    occurredAt: new Date(),
    metadata: 'metadata' in event ? event.metadata : {},
    userId: actor.userId,
    username: actor.username,
  };

  if (transaction) await ClientHistory.create(row, { transaction });
  else await ClientHistory.create(row);
};
