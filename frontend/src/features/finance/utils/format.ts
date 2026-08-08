import { addMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// The register reads in whole bolivianos. Cents are stored on every row but never shown here —
// the sign is rendered separately so it can carry its own colour.
export const formatMoney = (amount: number): string =>
  Math.round(Math.abs(amount)).toLocaleString('es-BO');

const monthDate = (month: string) => parseISO(`${month}-01T12:00:00`);

export const formatMonthLabel = (month: string): string => {
  const label = format(monthDate(month), 'MMMM yyyy', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

// Reads inside a sentence ("Al 3 de agosto"), so it keeps the month lowercase and drops the year:
// the month it qualifies is already named beside it. Midday, like monthDate, so a timezone behind
// UTC cannot walk the date back a day.
export const formatDayLabel = (date: string): string =>
  format(parseISO(`${date}T12:00:00`), "d 'de' MMMM", { locale: es });

export const shiftMonth = (month: string, delta: number): string =>
  format(addMonths(monthDate(month), delta), 'yyyy-MM');
