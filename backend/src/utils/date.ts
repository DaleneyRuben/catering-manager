import { addBusinessDays, subBusinessDays, format, parseISO } from 'date-fns';

export const addDeliveryDays = (startDate: string, days: number): string => {
  const result = addBusinessDays(parseISO(`${startDate}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
};

export const subtractDeliveryDays = (startDate: string, days: number): string => {
  const result = subBusinessDays(parseISO(`${startDate}T12:00:00`), days);
  return format(result, 'yyyy-MM-dd');
};
