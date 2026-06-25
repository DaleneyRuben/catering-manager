import { z } from 'zod';
import { isWeekend, parseISO } from 'date-fns';
import { decodeId } from '../utils/sqids';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(dateRegex, 'must be YYYY-MM-DD');
const weekdayDateField = dateField.refine(
  (v) => !isWeekend(parseISO(v)),
  'startDate must be a weekday (Mon–Fri)',
);

export const createSubscriptionSchema = z.object({
  planId: z.string().transform((v) => decodeId(v)),
  startDate: weekdayDateField.nullable().optional(),
  contractDate: dateField,
  duration: z.number().int().min(1),
  discount: z.number().int().min(0).optional(),
  renewalType: z.enum(['renewal', 'reactivation']).optional(),
  specialInstructions: z.record(z.string(), z.string()).optional(),
});

export const updateSubscriptionSchema = z.object({
  planId: z
    .string()
    .transform((v) => decodeId(v))
    .optional(),
  contractDate: dateField.optional(),
  startDate: weekdayDateField.optional(),
  duration: z.number().int().min(1).optional(),
  contractEndDate: dateField.optional(),
  suspendedDates: z.array(dateField).optional(),
  discount: z.number().int().min(0).optional(),
  specialInstructions: z.record(z.string(), z.string()).optional(),
});

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
