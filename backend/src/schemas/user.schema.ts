import { z } from 'zod';

const roles = ['admin', 'manager', 'delivery'] as const;

export const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(roles),
});

export const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(roles).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
