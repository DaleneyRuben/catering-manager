import { addDays, isWeekend, format, parseISO, differenceInBusinessDays } from 'date-fns';

export function addBusinessDays(dateString: string, days: number): string {
  let date = parseISO(dateString);
  let added = 0;
  while (added < days) {
    date = addDays(date, 1);
    if (!isWeekend(date)) added += 1;
  }
  return format(date, 'yyyy-MM-dd');
}

export function remainingDeliveryDays(startDate: Date, endDate: Date, today = new Date()): number {
  const startsInFuture = startDate > today;
  const effectiveStart = startsInFuture ? startDate : today;
  const shouldDiscountToday = !startsInFuture && !isWeekend(today);
  return Math.max(
    0,
    differenceInBusinessDays(endDate, effectiveStart) - (shouldDiscountToday ? 1 : 0),
  );
}

export function businessDaysUntil(from: Date, to: Date): number {
  let count = 0;
  let cur = new Date(from);
  while (cur <= to) {
    if (!isWeekend(cur)) count += 1;
    cur = addDays(cur, 1);
  }
  return count;
}
