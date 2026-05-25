import { addDays, isWeekend, format, parseISO } from 'date-fns';

export function addBusinessDays(dateString: string, days: number): string {
  let date = parseISO(dateString);
  let added = 0;
  while (added < days) {
    date = addDays(date, 1);
    if (!isWeekend(date)) added += 1;
  }
  return format(date, 'yyyy-MM-dd');
}
