import { z } from 'zod';

export const upsertMenuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  breakfast: z.string().optional(),
  morningSnack: z.string().optional(),
  salad: z.string().optional(),
  lunch: z.string().optional(),
  afternoonSnack: z.string().optional(),
  dinner: z.string().optional(),
  juice: z.string().optional(),
});

export type UpsertMenuDto = z.infer<typeof upsertMenuSchema>;
