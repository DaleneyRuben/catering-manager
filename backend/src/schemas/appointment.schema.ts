import { z } from 'zod';
import { appToday } from '../utils/date';
import { createClientSchema } from './client.schema';
import { createSubscriptionSchema } from './subscription.schema';

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const notPastDateField = dateField.refine((v) => v >= appToday(), 'date must be today or later');
const timeField = z.string().regex(/^\d{2}:\d{2}$/, 'must be HH:mm');

export const createAppointmentSchema = z
  .object({
    clientId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    date: notPastDateField,
    time: timeField,
  })
  .superRefine((data, ctx) => {
    const hasClientId = data.clientId !== undefined;
    const hasNameOrPhone = data.name !== undefined || data.phone !== undefined;

    if (hasClientId && hasNameOrPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'clientId and name/phone are mutually exclusive',
        path: ['clientId'],
      });
      return;
    }

    if (!hasClientId && (!data.name || !data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'name and phone are required when clientId is not provided',
        path: ['name'],
      });
    }
  });

export const updateAppointmentSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  date: notPastDateField.optional(),
  time: timeField.optional(),
});

export const convertAppointmentSchema = z.object({
  client: createClientSchema,
  subscription: createSubscriptionSchema,
});

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
