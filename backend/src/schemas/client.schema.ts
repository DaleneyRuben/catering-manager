import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1),
  sex: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD'),
  phoneNumber: z.string().min(1),
  address: z.string().min(1),
  deliveryZone: z.string().min(1),
  underlyingDiseases: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});

export type CreateClientDto = z.infer<typeof createClientSchema>;
