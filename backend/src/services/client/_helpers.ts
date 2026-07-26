import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';
import { deriveClientStatus } from '../../utils/clientStatus';

export const INCLUDE_SUBSCRIPTION_ORDERED = [
  { model: Subscription, include: [Plan], separate: true, order: [['id', 'DESC']] as never },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withStatus(client: any): Record<string, unknown> {
  const today = appToday();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: any[] = client.subscriptions ?? [];
  // An unpaid subscription "isn't real yet" (see ADR-004/005) — while one is pending,
  // display should reflect the latest PAID subscription, not the newer unpaid one.
  subs.sort(
    (a: { id: number; paid?: boolean }, b: { id: number; paid?: boolean }) =>
      Number(b.paid ?? true) - Number(a.paid ?? true) || b.id - a.id,
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
