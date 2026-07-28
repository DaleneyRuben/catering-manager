import { format, parseISO } from 'date-fns';
import type { Subscription } from '@/features/clients/types';

const isLive = (sub: Subscription) => !sub.finalizedAt;

const formatDate = (date: string) => format(parseISO(date), 'dd/MM/yyyy');

// One line, two readers: the header banner and the delete confirmation, which must recap exactly
// the renewal the banner announces.
export function formatRenewalMeta(renewal: Subscription): string {
  const { startDate, contractEndDate, duration, plan } = renewal;
  const contract =
    startDate && contractEndDate
      ? `${formatDate(startDate)} → ${formatDate(contractEndDate)} · ${duration} días hábiles`
      : `${duration} días hábiles · sin fecha de inicio`;

  return `${plan.name} · ${contract}`;
}

const coversToday = (sub: Subscription, today: string) =>
  isLive(sub) &&
  Boolean(sub.startDate && sub.startDate <= today) &&
  Boolean(sub.contractEndDate && sub.contractEndDate >= today);

// A queued renewal only exists behind a plan that is still running: when the not-yet-started plan
// is the client's only live one they are simply "Programado", which the status pill already says.
export function findQueuedRenewal(
  subscriptions: Subscription[],
  today = format(new Date(), 'yyyy-MM-dd'),
): Subscription | null {
  if (!subscriptions.some((sub) => coversToday(sub, today))) return null;
  return (
    subscriptions.find(
      (sub) => isLive(sub) && !coversToday(sub, today) && (!sub.startDate || sub.startDate > today),
    ) ?? null
  );
}
