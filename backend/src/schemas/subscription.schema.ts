import { z } from 'zod';
import { parseISO } from 'date-fns';
import { checkIsWeekend } from '../utils/devFlags';
import { decodeId } from '../utils/sqids';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(dateRegex, 'must be YYYY-MM-DD');
const weekdayDateField = dateField.refine(
  (v) => !checkIsWeekend(parseISO(v)),
  'startDate must be a weekday (Mon–Fri)',
);

export const createSubscriptionSchema = z.object({
  planId: z.string().transform((v) => decodeId(v)),
  startDate: weekdayDateField.nullable().optional(),
  contractDate: dateField,
  duration: z.number().int().min(1),
  // Bounded only by zero — a contract longer than the plan's quoted 20 days costs more than the
  // plan, so capping this at plan.price would reject legitimate subscriptions.
  price: z.number().min(0),
  renewalType: z.enum(['renewal', 'reactivation']).optional(),
  specialInstructions: z.record(z.string(), z.string()).optional(),
  paid: z.boolean().optional(),
  appointmentId: z
    .string()
    .transform((v) => decodeId(v))
    .optional(),
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
  price: z.number().min(0).optional(),
  specialInstructions: z.record(z.string(), z.string()).optional(),
});

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
