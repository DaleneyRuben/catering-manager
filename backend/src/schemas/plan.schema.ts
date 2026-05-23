import { z } from 'zod';

const meals = [
  'breakfast',
  'morning_snack',
  'salad',
  'lunch',
  'afternoon_snack',
  'dinner',
  'juice',
  'extra',
] as const;

export const createPlanSchema = z.object({
  name: z.string().min(1),
  meals: z.array(z.enum(meals)).min(1),
  description: z.string().default(''),
  price: z.number().positive(),
  discount: z.number().min(0).default(0),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanDto = z.infer<typeof createPlanSchema>;
export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
