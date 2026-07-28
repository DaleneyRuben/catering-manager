import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';
import { deriveClientStatus } from '../../utils/clientStatus';

export const INCLUDE_SUBSCRIPTION_ORDERED = [
  { model: Subscription, include: [Plan], separate: true, order: [['id', 'DESC']] as never },
];

type SubscriptionDatesLike = {
  id: number;
  startDate?: string | null;
  contractEndDate?: string | null;
  finalizedAt?: string | null;
};

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
export function compareCurrentSubscription(
  a: SubscriptionDatesLike,
  b: SubscriptionDatesLike,
  today: string,
): number {
  return Number(coversDate(b, today)) - Number(coversDate(a, today)) || b.id - a.id;
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
    {
      pausedSince: client.pausedSince ?? null,
      sub: sub
        ? {
            startDate: sub.startDate ?? null,
            contractEndDate: sub.contractEndDate ?? null,
            suspendedDates: sub.suspendedDates ?? [],
            finalizedAt: sub.finalizedAt ?? null,
          }
        : null,
    },
    today,
  );
  const plain: Record<string, unknown> =
    typeof client.toJSON === 'function' ? client.toJSON() : { ...client };
  return { ...plain, status };
}
