import { addBusinessDays, subBusinessDays, format } from 'date-fns';

export const addDeliveryDays = (startDate: string, days: number): string => {
  const result = addBusinessDays(new Date(`${startDate}T12:00:00Z`), days);
  return format(result, 'yyyy-MM-dd');
};

export const subtractDeliveryDays = (startDate: string, days: number): string => {
  const result = subBusinessDays(new Date(`${startDate}T12:00:00Z`), days);
  return format(result, 'yyyy-MM-dd');
};
