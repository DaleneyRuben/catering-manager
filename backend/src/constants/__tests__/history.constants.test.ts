import { HISTORY_EVENTS } from '../history.constants';

// Every other test names events through HISTORY_EVENTS, which is what keeps the codebase from
// hardcoding them — but it also means a changed value would sail through those tests unnoticed.
// These strings are persisted in client_history.eventType, so changing one is a data change that
// needs a migration. This test is the only place the literals are written down, so that a rename
// has to be deliberate: it fails, you write the migration, then you update it here.
describe('HISTORY_EVENTS', () => {
  it('pins the exact strings written to client_history.eventType', () => {
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

  it('keeps every key in <subject>_<verb> shape', () => {
    Object.values(HISTORY_EVENTS).forEach((value) => {
      expect(value).toMatch(/^[a-z]+_[a-z]+$/);
    });
  });
});
