import Client from '../../../models/Client';
import Subscription from '../../../models/Subscription';
import { findDeliveryClientsForDate } from '../find-delivery-clients';

jest.mock('../../../models/Client');
jest.mock('../../../models/Plan');
jest.mock('../../../models/Subscription');

const makeClient = (name: string) => ({ name });

const makeSubscription = (
  overrides: Partial<{
    startDate: string;
    suspendedDates: string[];
    client: { name: string };
  }> = {},
) => ({
  startDate: '2026-06-01',
  contractEndDate: '2026-06-30',
  suspendedDates: [],
  client: makeClient('Ana López'),
  plan: { meals: ['breakfast', 'lunch'] },
  ...overrides,
});

describe('findDeliveryClientsForDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns names of active clients sorted by startDate, oldest first', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ startDate: '2026-06-10', client: makeClient('Zara Gomez') }),
      makeSubscription({ startDate: '2026-05-01', client: makeClient('María Torres') }),
      makeSubscription({ startDate: '2026-06-05', client: makeClient('Ana López') }),
    ]);

    const names = await findDeliveryClientsForDate('2026-06-15');

    expect(names).toEqual(['María Torres', 'Ana López', 'Zara Gomez']);
  });

  it('breaks ties on the same startDate alphabetically by name', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ startDate: '2026-06-01', client: makeClient('Zara Gomez') }),
      makeSubscription({ startDate: '2026-06-01', client: makeClient('Ana López') }),
      makeSubscription({ startDate: '2026-06-01', client: makeClient('María Torres') }),
    ]);

    const names = await findDeliveryClientsForDate('2026-06-15');

    expect(names).toEqual(['Ana López', 'María Torres', 'Zara Gomez']);
  });

  it('excludes clients whose date is in suspendedDates', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([
      makeSubscription({ client: makeClient('Ana López'), suspendedDates: ['2026-06-15'] }),
      makeSubscription({ client: makeClient('Carlos Ríos') }),
    ]);

    const names = await findDeliveryClientsForDate('2026-06-15');

    expect(names).toEqual(['Carlos Ríos']);
  });

  it('returns empty array when no active clients exist', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    const names = await findDeliveryClientsForDate('2026-06-15');

    expect(names).toEqual([]);
  });

  it('excludes finalized subscriptions from the query', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await findDeliveryClientsForDate('2026-06-15');

    const call = (Subscription.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where?.finalizedAt).toEqual({ [Symbol.for('is')]: null });
  });

  it('excludes paused clients via where clause on Client include', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await findDeliveryClientsForDate('2026-06-15');

    const call = (Subscription.findAll as jest.Mock).mock.calls[0][0];
    const clientInclude = call.include?.find((i: { model: typeof Client }) => i.model === Client);
    expect(clientInclude?.where).toMatchObject({ pausedSince: null });
  });
});
