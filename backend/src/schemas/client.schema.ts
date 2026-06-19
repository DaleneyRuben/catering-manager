import { z } from 'zod';
import { ZONES, DELIVERIES, SEX_OPTIONS } from '../constants/client.constants';

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

export const createClientSchema = z.object({
  name: z.string().min(1),
  sex: z.enum(SEX_OPTIONS),
  dateOfBirth: dateField,
  phoneNumber: z.string().min(1),
  address: z.string().min(1),
  deliveryZone: z.enum(ZONES),
  delivery: z.enum(DELIVERIES),
  nit: z.string().optional(),
  businessName: z.string().optional(),
  underlyingDiseases: z.array(z.string().max(200)).max(50).default([]),
  restrictions: z.array(z.string().max(200)).max(50).default([]),
});

export type CreateClientDto = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  sex: z.enum(SEX_OPTIONS).optional(),
  dateOfBirth: dateField.optional(),
  phoneNumber: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  deliveryZone: z.enum(ZONES).optional(),
  delivery: z.enum(DELIVERIES).optional(),
  nit: z.string().nullable().optional(),
  businessName: z.string().nullable().optional(),
  underlyingDiseases: z.array(z.string().max(200)).max(50).optional(),
  restrictions: z.array(z.string().max(200)).max(50).optional(),
  pausedSince: z.string().nullable().optional(),
});

export type UpdateClientDto = z.infer<typeof updateClientSchema>;

export const setGroupSchema = z.object({
  memberIds: z.array(z.string()),
});

export type SetGroupDto = z.infer<typeof setGroupSchema>;
