import { addBusinessDays, formatISO } from 'date-fns';

export const addDeliveryDays = (startDate: string, days: number): string => {
  const result = addBusinessDays(new Date(`${startDate}T12:00:00Z`), days);
  return formatISO(result, { representation: 'date' });
};
