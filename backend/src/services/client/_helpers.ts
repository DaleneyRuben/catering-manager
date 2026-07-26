import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';
import { deriveClientStatus } from '../../utils/clientStatus';

export const INCLUDE_SUBSCRIPTION_ORDERED = [
  { model: Subscription, include: [Plan], separate: true, order: [['id', 'DESC']] as never },
];

type SubscriptionPriorityLike = { id: number; paid?: boolean };

// An unpaid subscription "isn't real yet" (see ADR-004/005) — the primary subscription is
// the latest PAID one, not merely the newest by id.
export function compareSubscriptionPriority(
  a: SubscriptionPriorityLike,
  b: SubscriptionPriorityLike,
): number {
  return Number(b.paid ?? true) - Number(a.paid ?? true) || b.id - a.id;
}

export function getPrimarySubscription<T extends SubscriptionPriorityLike>(subs: T[]): T | null {
  return [...subs].sort(compareSubscriptionPriority)[0] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withStatus(client: any): Record<string, unknown> {
  const today = appToday();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: any[] = client.subscriptions ?? [];
  subs.sort(compareSubscriptionPriority);
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
