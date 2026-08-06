import {
  addBusinessDays as dfnsAddBusinessDays,
  subBusinessDays as dfnsSubBusinessDays,
  differenceInBusinessDays,
  eachDayOfInterval,
  isWeekend,
  format,
  parseISO,
} from 'date-fns';

export function addBusinessDays(dateString: string, days: number): string {
  const result = dfnsAddBusinessDays(parseISO(`${dateString}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
}

export function subtractBusinessDays(dateString: string, days: number): string {
  const result = dfnsSubBusinessDays(parseISO(`${dateString}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
}

// Mirrors the backend: calcContractEndDate (startDate counts as day 1, hence duration - 1) plus
// one delivery day per suspended date. Both cards on the plan tab preview from here so they agree
// with each other and with what the PATCH actually saves.
export function projectedEndDate(
  startDate: string,
  duration: number,
  suspendedCount: number,
): string {
  return addBusinessDays(startDate, duration - 1 + suspendedCount);
}

export function remainingDeliveryDays(startDate: Date, endDate: Date, today = new Date()): number {
  if (startDate > today) {
    // plan hasn't started: startDate counts as delivery day 1
    return Math.max(0, differenceInBusinessDays(endDate, startDate) + 1);
  }
  // plan has started: today's delivery is already scheduled, count strictly after today
  return Math.max(0, differenceInBusinessDays(endDate, today));
}

export function businessDaysUntil(from: Date, to: Date): number {
  if (from > to) return 0;
  return eachDayOfInterval({ start: from, end: to }).filter((d) => !isWeekend(d)).length;
}
