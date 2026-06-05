import Client from '../../models/Client';
import Subscription from '../../models/Subscription';
import reportService from '../report.service';

jest.mock('../../models/Client');
jest.mock('../../models/Subscription');

const makeClient = (name: string) => ({ name });

const makeSubscription = (
  overrides: Partial<{
    startDate: string;
    contractEndDate: string;
    suspendedDates: string[];
    client: { name: string };
  }> = {},
) => ({
  startDate: '2026-06-01',
  contractEndDate: '2026-06-30',
  suspendedDates: [],
  client: makeClient('Ana López'),
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
