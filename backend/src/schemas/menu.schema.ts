import { z } from 'zod';
import { parseISO } from 'date-fns';
import { checkIsWeekend } from '../utils/devFlags';

export const upsertMenuSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .refine((d) => !checkIsWeekend(parseISO(d)), 'No hay entregas los fines de semana'),
  breakfast: z.string().optional(),
  morningSnack: z.string().optional(),
  salad: z.string().optional(),
  lunch: z.string().optional(),
  afternoonSnack: z.string().optional(),
  dinner: z.string().optional(),
  juice: z.string().optional(),
});

export type UpsertMenuDto = z.infer<typeof upsertMenuSchema>;
