import type { Transaction } from 'sequelize';
import { HISTORY_EVENTS } from '../../constants/history.constants';
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
  price: number;
  appointmentId?: number;
};

// A later edit to an existing contract. It carries no plan fields because it changes none.
type ContractEventMetadata = {
  startDate: string | null;
  duration: number;
  contractEndDate: string | null;
};

// A move in the commercial terms of a running subscription — the plan, the price, or both. The
// price is carried on both sides even when only the plan moved, so the timeline can show the
// total beside a plan change instead of omitting it.
type PlanChangedMetadata = {
  planId: number;
  planName: string | null;
  planPrice: number | null;
  previousPlanId: number;
  previousPlanName: string | null;
  price: number;
  previousPrice: number;
};

type RenewalDeletedMetadata = {
  planId: number;
  planName: string | null;
  startDate: string | null;
  contractEndDate: string | null;
  duration: number;
  price: number;
  registeredAt: Date;
};

type PlanEvent = typeof HISTORY_EVENTS.PLAN_ASSIGNED | typeof HISTORY_EVENTS.PLAN_RENEWED;

export type HistoryEvent =
  | {
      type: PlanEvent | typeof HISTORY_EVENTS.PLAN_REACTIVATED;
      clientId: number;
      metadata: PlanEventMetadata;
    }
  | {
      type: typeof HISTORY_EVENTS.DATES_CHANGED;
      clientId: number;
      metadata: ContractEventMetadata;
    }
  | { type: typeof HISTORY_EVENTS.TERMS_CHANGED; clientId: number; metadata: PlanChangedMetadata }
  | {
      type: typeof HISTORY_EVENTS.RENEWAL_DELETED;
      clientId: number;
      metadata: RenewalDeletedMetadata;
    }
  | {
      type: typeof HISTORY_EVENTS.DAYS_SUSPENDED;
      clientId: number;
      metadata: { dates: string[] };
    }
  | {
      type:
        | typeof HISTORY_EVENTS.PLAN_PAUSED
        | typeof HISTORY_EVENTS.PLAN_RESUMED
        | typeof HISTORY_EVENTS.PLAN_FINALIZED
        | typeof HISTORY_EVENTS.CLIENT_DELETED;
      clientId: number;
    };

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
