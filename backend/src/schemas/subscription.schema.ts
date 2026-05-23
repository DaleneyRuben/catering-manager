import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(dateRegex, 'must be YYYY-MM-DD');

export const createSubscriptionSchema = z.object({
  planId: z.number().int().positive(),
  contractDate: dateField,
  startDate: dateField,
  contractEndDate: dateField,
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
