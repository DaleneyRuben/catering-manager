import type { HistoryEventType } from '../types/client';

export const EVENT_LABELS: Record<HistoryEventType, string> = {
  paused: 'Plan pausado',
  resumed: 'Plan reanudado',
  plan_assigned: 'Plan asignado',
  plan_changed: 'Plan modificado',
  suspended: 'Días suspendidos',
  reactivated: 'Cliente reactivado',
  finalized: 'Plan finalizado',
  deleted: 'Cliente eliminado',
};
