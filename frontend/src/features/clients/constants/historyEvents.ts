// The stored values of client_history.eventType, mirroring the backend's history.constants.ts.
// Every key is <subject>_<verb>, so the subject of an event is never left implicit.
export const HISTORY_EVENTS = {
  PLAN_ASSIGNED: 'plan_assigned',
  PLAN_RENEWED: 'plan_renewed',
  PLAN_REACTIVATED: 'plan_reactivated',
  PLAN_PAUSED: 'plan_paused',
  PLAN_RESUMED: 'plan_resumed',
  PLAN_FINALIZED: 'plan_finalized',
  // the plan, the discount, or both — what the client gets and what they pay for it
  TERMS_CHANGED: 'terms_changed',
  DATES_CHANGED: 'dates_changed',
  DAYS_SUSPENDED: 'days_suspended',
  RENEWAL_DELETED: 'renewal_deleted',
  CLIENT_DELETED: 'client_deleted',
} as const;

export type HistoryEventType = (typeof HISTORY_EVENTS)[keyof typeof HISTORY_EVENTS];

export const EVENT_LABELS: Record<HistoryEventType, string> = {
  plan_assigned: 'Plan asignado',
  plan_renewed: 'Plan renovado',
  plan_reactivated: 'Plan reactivado',
  plan_paused: 'Plan pausado',
  plan_resumed: 'Plan reanudado',
  plan_finalized: 'Plan finalizado',
  // a terms_changed row covers the plan, the price, or both — resolveEventLabel narrows it from
  // the metadata, and falls back to this when a row carries no previous values to compare
  terms_changed: 'Plan modificado',
  dates_changed: 'Fechas modificadas',
  days_suspended: 'Días suspendidos',
  renewal_deleted: 'Renovación eliminada',
  client_deleted: 'Cliente eliminado',
};

// events that name a plan the client is on, so the timeline row carries a plan chip
export const PLAN_CHIP_EVENTS: readonly HistoryEventType[] = [
  HISTORY_EVENTS.PLAN_ASSIGNED,
  HISTORY_EVENTS.PLAN_RENEWED,
  HISTORY_EVENTS.PLAN_REACTIVATED,
  HISTORY_EVENTS.TERMS_CHANGED,
];

export const PLAN_CHANGE_LABELS = {
  price: 'Precio modificado',
  plan: 'Plan modificado',
  both: 'Plan y precio modificados',
} as const;
