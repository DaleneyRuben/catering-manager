import { isWeekend } from 'date-fns';

export const checkIsWeekend = (date: Date): boolean => isWeekend(date);
