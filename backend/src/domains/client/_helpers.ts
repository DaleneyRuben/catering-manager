import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';
import { deriveClientStatus } from './derive-client-status';

export const INCLUDE_SUBSCRIPTION_ORDERED = [
  { model: Subscription, include: [Plan], separate: true, order: [['id', 'DESC']] as never },
];

type SubscriptionPriorityLike = { id: number; paid?: boolean };

type SubscriptionDatesLike = SubscriptionPriorityLike & {
  startDate?: string | null;
  contractEndDate?: string | null;
  finalizedAt?: string | null;
};

// An unpaid subscription "isn't real yet" (see ADR-004/005), so it loses to any paid one no
// matter how new it is or what dates it covers.
const byPaidFirst = (a: SubscriptionPriorityLike, b: SubscriptionPriorityLike): number =>
  Number(b.paid ?? true) - Number(a.paid ?? true);

// The primary subscription is the latest PAID one, not merely the newest by id.
export function compareSubscriptionPriority(
  a: SubscriptionPriorityLike,
  b: SubscriptionPriorityLike,
): number {
  return byPaidFirst(a, b) || b.id - a.id;
}

export function getPrimarySubscription<T extends SubscriptionPriorityLike>(subs: T[]): T | null {
  return [...subs].sort(compareSubscriptionPriority)[0] ?? null;
}

function coversDate(sub: SubscriptionDatesLike, date: string): boolean {
  return (
    !sub.finalizedAt &&
    !!sub.startDate &&
    sub.startDate <= date &&
    !!sub.contractEndDate &&
    sub.contractEndDate >= date
  );
}

// A renewal registered before the current plan ends leaves the client with two live
// subscriptions. The one that describes the client today is the one whose contract covers
// today — the newest one is still in the future and would report the client as "programado".
// Payment ranks above coverage: a pending unpaid renewal never describes the client, even once
// its own contract has started.
export function compareCurrentSubscription(
  a: SubscriptionDatesLike,
  b: SubscriptionDatesLike,
  today: string,
): number {
  return (
    byPaidFirst(a, b) || Number(coversDate(b, today)) - Number(coversDate(a, today)) || b.id - a.id
  );
}

// Same "covers today wins, else newest" rule as compareCurrentSubscription, used wherever a
// single subscription must be acted on (finalize, resume) instead of just displayed.
export function getCurrentSubscription<T extends SubscriptionDatesLike>(
  subs: T[],
  today: string,
): T | null {
  return [...subs].sort((a, b) => compareCurrentSubscription(a, b, today))[0] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withStatus(client: any): Record<string, unknown> {
  const today = appToday();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: any[] = client.subscriptions ?? [];
  subs.sort((a: SubscriptionDatesLike, b: SubscriptionDatesLike) =>
    compareCurrentSubscription(a, b, today),
  );
  const sub = subs[0] ?? null;
  const status = deriveClientStatus(
    sub
      ? {
          startDate: sub.startDate ?? null,
          contractEndDate: sub.contractEndDate ?? null,
          suspendedDates: sub.suspendedDates ?? [],
          finalizedAt: sub.finalizedAt ?? null,
          pausedSince: sub.pausedSince ?? null,
        }
      : null,
    today,
  );
  const plain: Record<string, unknown> =
    typeof client.toJSON === 'function' ? client.toJSON() : { ...client };
  // Derived, never stored: the detail view needs to know whether the plan on screen is the paused
  // one to choose between Pausar and Reanudar, and that is a fact about the current subscription.
  return { ...plain, status, pausedSince: sub?.pausedSince ?? null };
}
