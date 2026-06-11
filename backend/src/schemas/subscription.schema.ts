import { z } from 'zod';
import { isWeekend, parseISO } from 'date-fns';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(dateRegex, 'must be YYYY-MM-DD');
const weekdayDateField = dateField.refine(
  (v) => !isWeekend(parseISO(v)),
  'startDate must be a weekday (Mon–Fri)',
);

export const createSubscriptionSchema = z.object({
  planId: z.number().int().positive(),
  startDate: weekdayDateField.nullable().optional(),
  contractDate: dateField,
  duration: z.number().int().min(1),
  discount: z.number().int().min(0).default(0),
  renewalType: z.enum(['renewal', 'reactivation']).optional(),
});

export const updateSubscriptionSchema = z.object({
  planId: z.number().int().positive().optional(),
  contractDate: dateField.optional(),
  startDate: weekdayDateField.optional(),
  duration: z.number().int().min(1).optional(),
  contractEndDate: dateField.optional(),
  suspendedDates: z.array(dateField).optional(),
  discount: z.number().int().min(0).optional(),
});

export type CreateSubscriptionDto = z.input<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
