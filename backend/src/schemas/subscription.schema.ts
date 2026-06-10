import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(dateRegex, 'must be YYYY-MM-DD');

export const createSubscriptionSchema = z.object({
  planId: z.number().int().positive(),
  startDate: dateField.nullable().optional(),
  contractDate: dateField,
  duration: z.number().int().min(1),
  discount: z.number().int().min(0).default(0),
  renewalType: z.enum(['renewal', 'reactivation']).optional(),
});

export const updateSubscriptionSchema = z.object({
  planId: z.number().int().positive().optional(),
  contractDate: dateField.optional(),
  startDate: dateField.optional(),
  duration: z.number().int().min(1).optional(),
  contractEndDate: dateField.optional(),
  suspendedDates: z.array(dateField).optional(),
  discount: z.number().int().min(0).optional(),
});

export type CreateSubscriptionDto = z.input<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
