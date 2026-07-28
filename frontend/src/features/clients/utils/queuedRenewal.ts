import { format } from 'date-fns';
import type { Subscription } from '@/features/clients/types';

// A queued renewal only exists alongside another subscription: when a not-yet-started plan is the
// client's only one they are simply "Programado", which the status pill already says.
export function findQueuedRenewal(
  subscriptions: Subscription[],
  today = format(new Date(), 'yyyy-MM-dd'),
): Subscription | null {
  if (subscriptions.length < 2) return null;
  return (
    subscriptions.find((sub) => !sub.finalizedAt && (!sub.startDate || sub.startDate > today)) ??
    null
  );
}
