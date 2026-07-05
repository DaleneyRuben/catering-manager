import Client from '../../../models/Client';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import { findActiveSubscriptionsForDate } from '../find-active-subscriptions-for-date';

jest.mock('../../../models/Client');
jest.mock('../../../models/Plan');
jest.mock('../../../models/Subscription');

const makeClient = (name: string) => ({ name });

const makeSubscription = (
  overrides: Partial<{
    startDate: string;
    contractEndDate: string;
    suspendedDates: string[];
    client: { name: string };
    plan: { meals: string[] };
  }> = {},
) => ({
  startDate: '2026-06-01',
  contractEndDate: '2026-06-30',
  suspendedDates: [],
  client: makeClient('Ana López'),
  plan: { meals: ['breakfast', 'lunch', 'dinner'] },
  ...overrides,
});

describe('findActiveSubscriptionsForDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns subscriptions active on the given date', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([makeSubscription()]);

    const rows = await findActiveSubscriptionsForDate('2026-06-15');

    expect(rows).toHaveLength(1);
  });

  it('excludes subscriptions suspended on the given date', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ client: makeClient('Suspended'), suspendedDates: ['2026-06-15'] }),
      makeSubscription({ client: makeClient('Active') }),
    ]);

    const rows = await findActiveSubscriptionsForDate('2026-06-15');

    expect(rows.map((r) => (r.client as { name: string }).name)).toEqual(['Active']);
  });

  it('queries with the date range, finalizedAt, and pausedSince conditions', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await findActiveSubscriptionsForDate('2026-06-15');

    const call = (Subscription.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where?.startDate).toBeDefined();
    expect(call.where?.contractEndDate).toBeDefined();
    expect(call.where?.finalizedAt).toEqual({ [Symbol.for('is')]: null });
    const clientInclude = call.include?.find((i: { model: typeof Client }) => i.model === Client);
    expect(clientInclude?.where).toMatchObject({ pausedSince: null });
  });

  it('includes both Client and Plan models', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await findActiveSubscriptionsForDate('2026-06-15');

    expect(Subscription.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Client }),
          expect.objectContaining({ model: Plan }),
        ]),
      }),
    );
  });

  it('returns an empty array when nothing matches', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    const rows = await findActiveSubscriptionsForDate('2026-06-15');

    expect(rows).toEqual([]);
  });
});
