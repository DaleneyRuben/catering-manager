import {
  addBusinessDays,
  subBusinessDays,
  format,
  parseISO,
  getDay,
  startOfISOWeek,
  addDays,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const APP_TIMEZONE = 'America/La_Paz';

// formatInTimeZone ensures the correct Bolivia date regardless of server timezone.
export const appToday = (): string => formatInTimeZone(new Date(), APP_TIMEZONE, 'yyyy-MM-dd');

// Converts a Date timestamp to its Bolivia calendar date string.
export const toAppDate = (d: Date): string => formatInTimeZone(d, APP_TIMEZONE, 'yyyy-MM-dd');

export const addDeliveryDays = (startDate: string, days: number): string => {
  const result = addBusinessDays(parseISO(`${startDate}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
};

export const subtractDeliveryDays = (startDate: string, days: number): string => {
  const result = subBusinessDays(parseISO(`${startDate}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
};

// Plain calendar days — unlike addDeliveryDays, weekends are not skipped.
export const addCalendarDays = (startDate: string, days: number): string => {
  const result = addDays(parseISO(`${startDate}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
};

// startDate counts as day 1, so end = startDate + (duration - 1) delivery days
export const calcContractEndDate = (startDate: string | null, duration: number): string | null => {
  if (!startDate) return null;
  return addDeliveryDays(startDate, duration - 1);
};

// Returns the Mon–Fri bounds of the current display week (Bolivia time).
// On Sunday the upcoming week is returned so the view resets for a fresh week.
export const getCurrentMenuWeek = (): { start: string; end: string } => {
  const todayStr = appToday();
  const today = parseISO(todayStr);
  const dayOfWeek = getDay(today); // 0=Sun, 1=Mon, …, 6=Sat
  const monday = dayOfWeek === 0 ? addDays(today, 1) : startOfISOWeek(today);
  const friday = addDays(monday, 4);
  return { start: format(monday, 'yyyy-MM-dd'), end: format(friday, 'yyyy-MM-dd') };
};
