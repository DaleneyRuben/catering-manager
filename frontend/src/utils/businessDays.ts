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

export function subtractBusinessDays(dateString: string, days: number): string {
  let date = parseISO(dateString);
  let subtracted = 0;
  while (subtracted < days) {
    date = addDays(date, -1);
    if (!isWeekend(date)) subtracted += 1;
  }
  return format(date, 'yyyy-MM-dd');
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
  let count = 0;
  let cur = from;
  while (cur <= to) {
    if (!isWeekend(cur)) count += 1;
    cur = addDays(cur, 1);
  }
  return count;
}
