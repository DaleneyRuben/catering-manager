import { parseISO } from 'date-fns';
import { checkIsWeekend } from '@/utils/devFlags';

// The "start date must be a weekday" rule is enforced in three places (new-client wizard,
// renewal form, assign-start-date modal). Keeping it here means the weekend bypass flag reaches
// all of them — calling date-fns' isWeekend directly at a call site silently opts that site out.
// An empty value is not a weekend: required-ness is a separate rule owned by each form.
export const isWeekendStartDate = (date: string): boolean =>
  !!date && checkIsWeekend(parseISO(date));
