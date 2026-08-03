import type { Transaction } from 'sequelize';
import ClientHistory from '../../models/ClientHistory';
import type { Actor } from '../../types/actor';

// A plan being put in place: the plan and what the client pays for it, alongside the contract it
// runs for. planName and planPrice are nullable rather than optional — they are null only when the
// plan row is gone by the time the event is written.
type PlanEventMetadata = {
  startDate: string | null;
  duration: number;
  contractEndDate: string | null;
  planId: number;
  planName: string | null;
  planPrice: number | null;
  discount: number;
  appointmentId?: number;
};

// A later edit to an existing contract. It carries no plan fields because it changes none.
type ContractEventMetadata = {
  startDate: string | null;
  duration: number;
  contractEndDate: string | null;
};

// A move in the commercial terms of a running subscription — the plan, the discount, or both.
type PlanChangedMetadata = {
  planId: number;
  planName: string | null;
  planPrice: number | null;
  previousPlanId: number;
  previousPlanName: string | null;
  discount: number;
  previousDiscount: number;
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
  | { type: 'contract_updated'; clientId: number; metadata: ContractEventMetadata }
  | { type: 'plan_changed'; clientId: number; metadata: PlanChangedMetadata }
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
