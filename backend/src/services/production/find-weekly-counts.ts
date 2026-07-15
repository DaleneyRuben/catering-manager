import { addCalendarDays, getCurrentMenuWeek } from '../../utils/date';
import { findActiveSubscriptionsForDate } from '../subscription';

export type WeeklyCounts = {
  weekStart: string;
  weekEnd: string;
  days: { date: string; count: number }[];
};

// weekStart is an absolute Monday (validated by the caller); defaults to the current display week.
export const findWeeklyCounts = async (weekStart?: string): Promise<WeeklyCounts> => {
  const start = weekStart ?? getCurrentMenuWeek().start;
  const end = addCalendarDays(start, 4);
  const dates = Array.from({ length: 5 }, (_, i) => addCalendarDays(start, i));

  const counts = await Promise.all(dates.map((date) => findActiveSubscriptionsForDate(date)));

  return {
    weekStart: start,
    weekEnd: end,
    days: dates.map((date, i) => ({ date, count: counts[i].length })),
  };
};
