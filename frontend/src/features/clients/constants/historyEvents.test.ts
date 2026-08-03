import { EVENT_LABELS, HISTORY_EVENTS } from '@/features/clients/constants/historyEvents';

// The rest of the frontend names events through HISTORY_EVENTS, so a changed value would sail
// through those tests unnoticed. These strings come off the wire from client_history.eventType and
// must stay identical to the backend's history.constants.ts — this is the only place the literals
// are written down on this side, so a rename has to be deliberate on both.
describe('HISTORY_EVENTS', () => {
  it('pins the exact strings the API sends, matching the backend constant', () => {
    expect(HISTORY_EVENTS).toEqual({
      PLAN_ASSIGNED: 'plan_assigned',
      PLAN_RENEWED: 'plan_renewed',
      PLAN_REACTIVATED: 'plan_reactivated',
      PLAN_PAUSED: 'plan_paused',
      PLAN_RESUMED: 'plan_resumed',
      PLAN_FINALIZED: 'plan_finalized',
      TERMS_CHANGED: 'terms_changed',
      DATES_CHANGED: 'dates_changed',
      DAYS_SUSPENDED: 'days_suspended',
      RENEWAL_DELETED: 'renewal_deleted',
      CLIENT_DELETED: 'client_deleted',
    });
  });

  it('gives every event a label, so no timeline row falls back to a raw key', () => {
    Object.values(HISTORY_EVENTS).forEach((event) => {
      expect(EVENT_LABELS[event]).toBeTruthy();
    });
  });
});
