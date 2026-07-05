import Client from '../../../models/Client';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import { findActiveClientsWithPlansForDate } from '../find-active-clients-with-plans-for-date';

jest.mock('../../../models/Client');
jest.mock('../../../models/Plan');
jest.mock('../../../models/Subscription');

const makeClient = (name: string) => ({ name });
const makePlan = (meals: string[] = ['breakfast', 'lunch', 'dinner']) => ({ meals });

const makeSubscription = (
  overrides: Partial<{
    suspendedDates: string[];
    specialInstructions: Record<string, string>;
    client: { name: string };
    plan: { meals: string[] };
  }> = {},
) => ({
  startDate: '2026-06-01',
  contractEndDate: '2026-06-30',
  suspendedDates: [],
  specialInstructions: {},
  client: makeClient('Ana López'),
  plan: makePlan(),
  ...overrides,
});

describe('findActiveClientsWithPlansForDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns name, planMeals and specialInstructions for active non-suspended clients', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({
        client: makeClient('Ana López'),
        plan: makePlan(['breakfast', 'lunch']),
        specialInstructions: { salad: 'DAR GRANDES' },
      }),
    ]);

    const result = await findActiveClientsWithPlansForDate('2026-06-15');

    expect(result).toEqual([
      {
        name: 'Ana López',
        planMeals: ['breakfast', 'lunch'],
        specialInstructions: { salad: 'DAR GRANDES' },
      },
    ]);
  });

  it('defaults specialInstructions to empty object when null', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ specialInstructions: undefined as unknown as Record<string, string> }),
    ]);

    const result = await findActiveClientsWithPlansForDate('2026-06-15');

    expect(result[0].specialInstructions).toEqual({});
  });

  it('excludes clients whose date is in suspendedDates', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ client: makeClient('Suspended'), suspendedDates: ['2026-06-15'] }),
      makeSubscription({ client: makeClient('Active') }),
    ]);

    const result = await findActiveClientsWithPlansForDate('2026-06-15');

    expect(result.map((r) => r.name)).toEqual(['Active']);
  });

  it('returns empty array when no subscriptions match', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    const result = await findActiveClientsWithPlansForDate('2026-06-15');

    expect(result).toEqual([]);
  });

  it('includes Plan model in the query', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await findActiveClientsWithPlansForDate('2026-06-15');

    expect(Subscription.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Client }),
          expect.objectContaining({ model: Plan }),
        ]),
      }),
    );
  });

  it('excludes finalized subscriptions from the query', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await findActiveClientsWithPlansForDate('2026-06-15');

    const call = (Subscription.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where?.finalizedAt).toEqual({ [Symbol.for('is')]: null });
  });
});
