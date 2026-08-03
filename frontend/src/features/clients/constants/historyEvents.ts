import type { HistoryEventType } from '@/features/clients/types';

export const EVENT_LABELS: Record<HistoryEventType, string> = {
  paused: 'Plan pausado',
  resumed: 'Plan reanudado',
  plan_assigned: 'Plan asignado',
  plan_renewed: 'Plan renovado',
  // a plan_changed row covers the plan, the price, or both — resolveEventLabel narrows it from
  // the metadata, and falls back to this when a row carries no previous values to compare
  plan_changed: 'Plan modificado',
  contract_updated: 'Fechas modificadas',
  suspended: 'Días suspendidos',
  reactivated: 'Plan reactivado',
  finalized: 'Plan finalizado',
  renewal_deleted: 'Renovación eliminada',
  deleted: 'Cliente eliminado',
};

export const PLAN_CHANGE_LABELS = {
  price: 'Precio modificado',
  plan: 'Plan modificado',
  both: 'Plan y precio modificados',
} as const;
