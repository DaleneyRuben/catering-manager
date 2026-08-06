import { endOfMonth, format, parseISO } from 'date-fns';

// A month is addressed as 'YYYY-MM' and resolved to inclusive day bounds, so every query filters
// on a DATEONLY range rather than extracting parts of the column.
export const monthBounds = (month: string): { start: string; end: string } => {
  const start = `${month}-01`;
  return { start, end: format(endOfMonth(parseISO(`${start}T12:00:00`)), 'yyyy-MM-dd') };
};
