import { z } from 'zod';

const requiredMessage = 'Usuario y contraseña son requeridos';

export const loginSchema = z.object({
  username: z.string({ error: requiredMessage }).min(1, requiredMessage),
  password: z.string({ error: requiredMessage }).min(1, requiredMessage),
});

export type LoginDto = z.infer<typeof loginSchema>;
