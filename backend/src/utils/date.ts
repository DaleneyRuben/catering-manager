import { addBusinessDays, subBusinessDays, format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const APP_TIMEZONE = 'America/La_Paz';

// formatInTimeZone ensures the correct Bolivia date regardless of server timezone.
export const appToday = (): string => formatInTimeZone(new Date(), APP_TIMEZONE, 'yyyy-MM-dd');

export const addDeliveryDays = (startDate: string, days: number): string => {
  const result = addBusinessDays(parseISO(`${startDate}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
};

export const subtractDeliveryDays = (startDate: string, days: number): string => {
  const result = subBusinessDays(parseISO(`${startDate}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
};
