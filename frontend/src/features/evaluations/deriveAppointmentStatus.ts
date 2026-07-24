import type { Appointment, NutritionistAppointmentStatus } from '@/features/evaluations/types';

export function deriveAppointmentStatus(appointment: Appointment): NutritionistAppointmentStatus {
  if (!appointment.subscriptionId) return 'pendiente';
  return appointment.subscription?.paid ? 'pagado' : 'no_pagado';
}
