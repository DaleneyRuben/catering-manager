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

// An upcoming subscription only exists behind a plan that is still running: when the not-yet-
// started plan is the client's only live one they are simply "Programado", which the status pill
// already says.
function upcomingSubscriptions(subscriptions: Subscription[], today: string): Subscription[] {
  if (!subscriptions.some((sub) => coversToday(sub, today))) return [];
  return subscriptions.filter(
    (sub) => isLive(sub) && !coversToday(sub, today) && (!sub.startDate || sub.startDate > today),
  );
}

// Payment-aware: an unpaid renewal "isn't real yet" (see ADR-004/005) and must never be announced
// as a confirmed queued renewal — use this for anything that displays plan/date details.
export function findQueuedRenewal(
  subscriptions: Subscription[],
  today = format(new Date(), 'yyyy-MM-dd'),
): Subscription | null {
  return upcomingSubscriptions(subscriptions, today).find((sub) => sub.paid !== false) ?? null;
}

// Payment-agnostic: the client can only have one upcoming subscription registered at a time
// regardless of whether it's been paid. Use this only to gate a new renewal (disable the button,
// block a second submission) or to read a coarse fact like "does it have a start date yet" —
// never to display its plan/price/dates as if confirmed.
export function findUpcomingSubscription(
  subscriptions: Subscription[],
  today = format(new Date(), 'yyyy-MM-dd'),
): Subscription | null {
  return upcomingSubscriptions(subscriptions, today)[0] ?? null;
}

export function hasUpcomingSubscription(
  subscriptions: Subscription[],
  today = format(new Date(), 'yyyy-MM-dd'),
): boolean {
  return findUpcomingSubscription(subscriptions, today) !== null;
}
