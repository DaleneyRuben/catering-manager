import { addCalendarDays, getCurrentMenuWeek } from '../../utils/date';
import { findActiveSubscriptionsForDate } from '../subscription';

export type WeeklyCounts = {
  weekStart: string;
  weekEnd: string;
  days: { date: string; count: number }[];
};

export const findWeeklyCounts = async (weekOffset = 0): Promise<WeeklyCounts> => {
  const current = getCurrentMenuWeek();
  const start = addCalendarDays(current.start, weekOffset * 7);
  const end = addCalendarDays(current.end, weekOffset * 7);
  const dates = Array.from({ length: 5 }, (_, i) => addCalendarDays(start, i));

  const counts = await Promise.all(dates.map((date) => findActiveSubscriptionsForDate(date)));

  return {
    weekStart: start,
    weekEnd: end,
    days: dates.map((date, i) => ({ date, count: counts[i].length })),
  };
};
