import { isWeekend } from 'date-fns';

const bypassWeekend = process.env.BYPASS_WEEKEND === 'true';

export const checkIsWeekend = (date: Date): boolean => (bypassWeekend ? false : isWeekend(date));
