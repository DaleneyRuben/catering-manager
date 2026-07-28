import { withStatus } from '../_helpers';

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

const baseClient = { id: 1, name: 'John Doe', pausedSince: null };

const sub = (over: Record<string, unknown>) => ({
  suspendedDates: [],
  finalizedAt: null,
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

  it('reports ended when the client has no subscription', () => {
    expect(withStatus({ ...baseClient, subscriptions: [] }).status).toBe('ended');
  });
});
