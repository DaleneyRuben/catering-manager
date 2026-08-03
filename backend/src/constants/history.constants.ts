// The stored values of client_history.eventType. Every key is <subject>_<verb>, so the subject of
// an event is never left implicit. Changing a value here is a data change: rows already written
// carry the old string and need a migration to match.
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
