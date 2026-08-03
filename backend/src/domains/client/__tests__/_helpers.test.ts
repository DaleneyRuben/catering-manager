import { getPrimarySubscription, withStatus } from '../_helpers';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/Plan');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));

describe('getPrimarySubscription', () => {
  it('returns null for an empty list', () => {
    expect(getPrimarySubscription([])).toBeNull();
  });

  it('returns the only subscription when there is just one', () => {
    const sub = { id: 5, paid: true };
    expect(getPrimarySubscription([sub])).toBe(sub);
  });

  it('prefers a paid subscription over a newer unpaid one', () => {
    const paid = { id: 5, paid: true };
    const unpaid = { id: 8, paid: false };
    expect(getPrimarySubscription([unpaid, paid])).toBe(paid);
  });

  it('falls back to the highest id when multiple subscriptions share paid status', () => {
    const older = { id: 5, paid: true };
    const newer = { id: 9, paid: true };
    expect(getPrimarySubscription([older, newer])).toBe(newer);
  });

  it('does not mutate the input array', () => {
    const unpaid = { id: 8, paid: false };
    const paid = { id: 5, paid: true };
    const subs = [unpaid, paid];

    getPrimarySubscription(subs);

    expect(subs).toEqual([unpaid, paid]);
  });
});

const baseClient = { id: 1, name: 'John Doe' };

const sub = (over: Record<string, unknown>) => ({
  suspendedDates: [],
  finalizedAt: null,
  pausedSince: null,
  ...over,
});

describe('withStatus', () => {
  it('derives status from the running subscription, not a newer future renewal', () => {
    const running = sub({ id: 10, startDate: '2026-05-11', contractEndDate: '2026-06-09' });
    const renewal = sub({ id: 11, startDate: '2026-06-10', contractEndDate: '2026-07-08' });

    const result = withStatus({ ...baseClient, subscriptions: [renewal, running] });

    expect(result.status).toBe('expiring');
  });

  it('puts the running subscription first so the client detail shows the current plan', () => {
    const running = sub({ id: 10, startDate: '2026-05-11', contractEndDate: '2026-06-09' });
    const renewal = sub({ id: 11, startDate: '2026-06-10', contractEndDate: '2026-07-08' });

    const result = withStatus({ ...baseClient, subscriptions: [renewal, running] });

    expect((result.subscriptions as { id: number }[])[0].id).toBe(10);
  });

  it('reports active when the running subscription ends beyond the expiry threshold', () => {
    const running = sub({ id: 10, startDate: '2026-05-11', contractEndDate: '2026-08-01' });
    const renewal = sub({ id: 11, startDate: '2026-08-03', contractEndDate: '2026-09-01' });

    const result = withStatus({ ...baseClient, subscriptions: [renewal, running] });

    expect(result.status).toBe('active');
  });

  it('ignores a finalized subscription that still covers today', () => {
    const finalized = sub({
      id: 10,
      startDate: '2026-05-11',
      contractEndDate: '2026-06-09',
      finalizedAt: '2026-06-04',
    });
    const renewal = sub({ id: 11, startDate: '2026-06-10', contractEndDate: '2026-07-08' });

    const result = withStatus({ ...baseClient, subscriptions: [renewal, finalized] });

    expect(result.status).toBe('future');
  });

  it('falls back to the newest subscription when none covers today', () => {
    const ended = sub({ id: 10, startDate: '2026-04-01', contractEndDate: '2026-05-01' });
    const renewal = sub({ id: 11, startDate: '2026-06-10', contractEndDate: '2026-07-08' });

    const result = withStatus({ ...baseClient, subscriptions: [ended, renewal] });

    expect(result.status).toBe('future');
    expect((result.subscriptions as { id: number }[])[0].id).toBe(11);
  });

  it('reports suspended from the running subscription when today is suspended', () => {
    const running = sub({
      id: 10,
      startDate: '2026-05-11',
      contractEndDate: '2026-08-01',
      suspendedDates: ['2026-06-05'],
    });
    const renewal = sub({ id: 11, startDate: '2026-08-03', contractEndDate: '2026-09-01' });

    const result = withStatus({ ...baseClient, subscriptions: [renewal, running] });

    expect(result.status).toBe('suspended');
  });

  it('ignores an unpaid renewal even on a day its contract covers', () => {
    const paid = sub({
      id: 10,
      startDate: '2026-04-01',
      contractEndDate: '2026-05-01',
      paid: true,
    });
    const unpaid = sub({
      id: 11,
      startDate: '2026-06-01',
      contractEndDate: '2026-07-08',
      paid: false,
    });

    const result = withStatus({ ...baseClient, subscriptions: [unpaid, paid] });

    expect(result.status).toBe('ended');
    expect((result.subscriptions as { id: number }[])[0].id).toBe(10);
  });

  it('reports ended when the client has no subscription', () => {
    expect(withStatus({ ...baseClient, subscriptions: [] }).status).toBe('ended');
  });

  // The bug that moved pausedSince off the client: a sin-fecha renewal used to pause the client
  // record, which suppressed every subscription they had — including the plan still running and
  // still paid for. Scoped to the subscription, the paused renewal only describes itself.
  it('stays active when a paused sin-fecha renewal sits behind a running plan', () => {
    const running = sub({ id: 10, startDate: '2026-05-11', contractEndDate: '2026-08-01' });
    const sinFecha = sub({
      id: 11,
      startDate: null,
      contractEndDate: null,
      pausedSince: new Date('2026-06-05'),
    });

    const result = withStatus({ ...baseClient, subscriptions: [sinFecha, running] });

    expect(result.status).toBe('active');
    expect((result.subscriptions as { id: number }[])[0].id).toBe(10);
  });

  it('reports paused once the running plan has ended and only the sin-fecha renewal is left', () => {
    const ended = sub({ id: 10, startDate: '2026-04-01', contractEndDate: '2026-05-01' });
    const sinFecha = sub({
      id: 11,
      startDate: null,
      contractEndDate: null,
      pausedSince: new Date('2026-06-05'),
    });

    const result = withStatus({ ...baseClient, subscriptions: [ended, sinFecha] });

    expect(result.status).toBe('paused');
  });

  it('reports paused when the running plan itself is paused mid-plan', () => {
    const running = sub({
      id: 10,
      startDate: '2026-05-11',
      contractEndDate: '2026-08-01',
      pausedSince: new Date('2026-06-04'),
    });

    const result = withStatus({ ...baseClient, subscriptions: [running] });

    expect(result.status).toBe('paused');
  });

  // The client payload keeps a pausedSince field so the detail view can still offer
  // Pausar/Reanudar, but it is now derived from the current subscription rather than stored.
  it('exposes the current subscription pausedSince on the client payload', () => {
    const pausedAt = new Date('2026-06-04');
    const running = sub({
      id: 10,
      startDate: '2026-05-11',
      contractEndDate: '2026-08-01',
      pausedSince: pausedAt,
    });

    expect(withStatus({ ...baseClient, subscriptions: [running] }).pausedSince).toEqual(pausedAt);
  });

  it('reports a null pausedSince when the current subscription is not paused', () => {
    const running = sub({ id: 10, startDate: '2026-05-11', contractEndDate: '2026-08-01' });
    const sinFecha = sub({
      id: 11,
      startDate: null,
      contractEndDate: null,
      pausedSince: new Date('2026-06-05'),
    });

    expect(withStatus({ ...baseClient, subscriptions: [sinFecha, running] }).pausedSince).toBeNull();
  });
});
