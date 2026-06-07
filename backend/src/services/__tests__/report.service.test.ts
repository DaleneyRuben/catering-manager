import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import reportService from '../report.service';

jest.mock('../../models/Client');
jest.mock('../../models/Plan');
jest.mock('../../models/Subscription');

const makeClient = (name: string, restrictions: string[] = []) => ({ name, restrictions });

const makePlan = (meals: string[] = ['breakfast', 'lunch', 'dinner']) => ({ meals });

const makeSubscription = (
  overrides: Partial<{
    startDate: string;
    contractEndDate: string;
    suspendedDates: string[];
    client: { name: string; restrictions: string[] };
    plan: { meals: string[] };
  }> = {},
) => ({
  startDate: '2026-06-01',
  contractEndDate: '2026-06-30',
  suspendedDates: [],
  client: makeClient('Ana López'),
  plan: makePlan(),
  ...overrides,
});

describe('reportService.findDeliveryClientsForDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns names of active clients sorted A-Z for the given date', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ client: makeClient('Zara Gomez') }),
      makeSubscription({ client: makeClient('Ana López') }),
      makeSubscription({ client: makeClient('María Torres') }),
    ]);

    const names = await reportService.findDeliveryClientsForDate('2026-06-15');

    expect(names).toEqual(['Ana López', 'María Torres', 'Zara Gomez']);
  });

  it('excludes clients whose date is in suspendedDates', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ client: makeClient('Ana López'), suspendedDates: ['2026-06-15'] }),
      makeSubscription({ client: makeClient('Carlos Ríos'), suspendedDates: [] }),
    ]);

    const names = await reportService.findDeliveryClientsForDate('2026-06-15');

    expect(names).toEqual(['Carlos Ríos']);
  });

  it('returns empty array when no active clients exist for the date', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    const names = await reportService.findDeliveryClientsForDate('2026-06-15');

    expect(names).toEqual([]);
  });

  it('queries with correct date range conditions', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await reportService.findDeliveryClientsForDate('2026-06-15');

    expect(Subscription.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([expect.objectContaining({ model: Client })]),
      }),
    );
  });
});

describe('reportService.findActiveClientsWithPlansForDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns name, planMeals, and restrictions for active non-suspended clients', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({
        client: makeClient('Ana López', ['platano']),
        plan: makePlan(['breakfast', 'lunch']),
      }),
    ]);

    const result = await reportService.findActiveClientsWithPlansForDate('2026-06-15');

    expect(result).toEqual([
      { name: 'Ana López', planMeals: ['breakfast', 'lunch'], restrictions: ['platano'] },
    ]);
  });

  it('excludes clients whose date is in suspendedDates', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ client: makeClient('Suspended'), suspendedDates: ['2026-06-15'] }),
      makeSubscription({ client: makeClient('Active') }),
    ]);

    const result = await reportService.findActiveClientsWithPlansForDate('2026-06-15');

    expect(result.map((r) => r.name)).toEqual(['Active']);
  });

  it('returns empty array when no subscriptions match', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    const result = await reportService.findActiveClientsWithPlansForDate('2026-06-15');

    expect(result).toEqual([]);
  });

  it('includes Plan model in the query', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await reportService.findActiveClientsWithPlansForDate('2026-06-15');

    expect(Subscription.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Client }),
          expect.objectContaining({ model: Plan }),
        ]),
      }),
    );
  });
});
