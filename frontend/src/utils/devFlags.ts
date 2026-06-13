import { isWeekend } from 'date-fns';

const bypassWeekend = import.meta.env.VITE_BYPASS_WEEKEND === 'true';

export const checkIsWeekend = (date: Date): boolean => (bypassWeekend ? false : isWeekend(date));
