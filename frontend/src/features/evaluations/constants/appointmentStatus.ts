import type { NutritionistAppointmentStatus } from '@/features/evaluations/types';

export const STATUS_LABELS: Record<NutritionistAppointmentStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  no_pagado: 'No pagado',
};

export const STATUS_CLASSES: Record<NutritionistAppointmentStatus, string> = {
  pendiente: 'bg-cream-2 text-muted',
  pagado: 'bg-ok-bg text-ok',
  no_pagado: 'bg-warn-bg text-warn',
};
