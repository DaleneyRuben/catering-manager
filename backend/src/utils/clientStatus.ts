import { addBusinessDays, parseISO } from 'date-fns';
import { EXPIRY_THRESHOLD_DAYS } from '../constants/subscription.constants';

export type ClientStatusValue = 'active' | 'expiring' | 'paused' | 'suspended' | 'ended' | 'future';

interface StatusInput {
  pausedSince: Date | null;
  sub: {
    startDate: string | null;
    contractEndDate: string | null;
    suspendedDates: string[];
    finalizedAt: string | null;
  } | null;
}

export function deriveClientStatus(input: StatusInput, today: string): ClientStatusValue {
  const { pausedSince, sub } = input;

  if (!sub) return 'ended';

  // manually finalized plans are immediately ended regardless of contractEndDate
  if (sub.finalizedAt !== null) return 'ended';

  // a real past contractEndDate ends the plan even if the client is paused
  if (sub.contractEndDate && sub.contractEndDate < today) return 'ended';

  // pausedSince covers both mid-plan pauses and sin-fecha (null dates with pausedSince set)
  if (pausedSince !== null) return 'paused';

  // null dates with no pause = plan not yet configured → future
  if (!sub.contractEndDate && !sub.startDate) return 'future';

  // contractEndDate without a startDate, or startDate still in the future
  if (!sub.startDate || sub.startDate > today) return 'future';

  // startDate is in the past but contractEndDate is missing — treat as ended
  if (!sub.contractEndDate) return 'ended';

  if (sub.suspendedDates.includes(today)) return 'suspended';

  // expiring: contractEndDate falls within EXPIRY_THRESHOLD_DAYS kitchen business days
  const threshold = addBusinessDays(parseISO(`${today}T12:00:00`), EXPIRY_THRESHOLD_DAYS);
  const thresholdStr = threshold.toISOString().slice(0, 10);
  if (sub.contractEndDate <= thresholdStr) return 'expiring';

  return 'active';
}
