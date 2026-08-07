import { z } from 'zod';
import { appToday } from '../utils/date';
import { decodeId } from '../utils/sqids';

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

// The register is cash basis: an expense records money that already moved, so a future date has
// nothing to record. Backdating stays open — the daily delivery payment is often entered late.
const pastOrTodayField = dateField.refine(
  (v) => v <= appToday(),
  'spentAt cannot be in the future',
);

const amountField = z.number().positive('amount must be greater than zero');

export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'must be YYYY-MM')
  .refine((v) => v <= appToday().slice(0, 7), 'month cannot be in the future');

// The movements list narrows; the three tiles never do. A category implies expenses, so the two
// controls cannot contradict each other (see movementScope in the finance domain).
export const movementFiltersSchema = z.object({
  direction: z.enum(['income', 'expense']).optional(),
  categoryId: z
    .string()
    .transform((v) => decodeId(v))
    .optional(),
  q: z.string().trim().min(1).optional(),
});

const categoryNameField = z.string().trim().min(1, 'name is required');

export const createCategorySchema = z.object({ name: categoryNameField });

// Rename, archive and restore are one PATCH because they are one row's state, and the modal can
// send a rename and a restore together. An empty body changes nothing, so it is a bad request
// rather than a silent 200.
export const updateCategorySchema = z
  .object({
    name: categoryNameField.optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.active !== undefined, 'nothing to update');

export const categoryQuerySchema = z.object({
  month: monthSchema.optional(),
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const createExpenseSchema = z.object({
  amount: amountField,
  categoryId: z.string().transform((v) => decodeId(v)),
  spentAt: pastOrTodayField,
  description: z.string().nullable().optional(),
});

export const updateExpenseSchema = z.object({
  amount: amountField.optional(),
  categoryId: z
    .string()
    .transform((v) => decodeId(v))
    .optional(),
  spentAt: pastOrTodayField.optional(),
  description: z.string().nullable().optional(),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
