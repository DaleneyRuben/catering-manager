import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1),
  sex: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD'),
  phoneNumber: z.string().min(1),
  address: z.string().min(1),
  zone: z.enum(['Centro', 'Sur']),
  delivery: z.enum(['La Oliva', 'Otro']),
  nit: z.string().optional(),
  businessName: z.string().optional(),
  underlyingDiseases: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
});

export type CreateClientDto = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD')
    .optional(),
  phoneNumber: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  zone: z.enum(['Centro', 'Sur']).optional(),
  delivery: z.enum(['La Oliva', 'Otro']).optional(),
  nit: z.string().nullable().optional(),
  businessName: z.string().nullable().optional(),
  underlyingDiseases: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateClientDto = z.infer<typeof updateClientSchema>;
