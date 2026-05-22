import { z } from 'zod';

const meals = ['breakfast', 'snack', 'lunch', 'dinner'] as const;

export const createPlanSchema = z.object({
  name: z.string().min(1),
  meals: z.array(z.enum(meals)).min(1),
  description: z.string().default(''),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanDto = z.infer<typeof createPlanSchema>;
export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
