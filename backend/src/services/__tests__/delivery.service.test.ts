import { findActiveSubscriptionsForDate } from '../subscriptionQueries';
import deliveryService from '../delivery.service';

jest.mock('../subscriptionQueries', () => ({
  findActiveSubscriptionsForDate: jest.fn(),
}));
jest.mock('../../utils/date', () => ({
  ...jest.requireActual('../../utils/date'),
  appToday: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { appToday } = require('../../utils/date');

const makeClient = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  name: 'Ana López',
  phoneNumber: '+591 7000 0000',
  deliveryZone: 'Centro',
  groupToken: null,
  ...overrides,
});

const makeSubscription = (client = makeClient()) => ({ client });

describe('deliveryService.findRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keys the response by today and tomorrow as calendar dates on a weekday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-23'); // Tuesday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await deliveryService.findRoute();

    expect(Object.keys(result)).toEqual(['2026-06-23', '2026-06-24']);
  });

  it('returns no groups for today when today is a Saturday, without querying', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-27'); // Saturday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await deliveryService.findRoute();

    expect(result['2026-06-27'].groups).toEqual([]);
    expect(findActiveSubscriptionsForDate).not.toHaveBeenCalledWith('2026-06-27');
  });

  it('returns no groups for today when today is a Sunday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-28'); // Sunday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await deliveryService.findRoute();

    expect(result['2026-06-28'].groups).toEqual([]);
  });

  it('returns no groups for tomorrow when tomorrow is a Saturday, while today still has data', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-26'); // Friday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await deliveryService.findRoute();

    expect(result['2026-06-26'].groups).toHaveLength(1);
    expect(result['2026-06-27'].groups).toEqual([]); // Saturday
  });

  it('returns an empty groups array when nothing matches on a weekday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-23');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await deliveryService.findRoute();

    expect(result['2026-06-23'].groups).toEqual([]);
    expect(result['2026-06-24'].groups).toEqual([]);
  });

  describe('grouping', () => {
    it('groups clients sharing a groupToken together', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(
          makeClient({ id: 1, name: 'Carmen Tapia', deliveryZone: 'Centro', groupToken: 'tok-1' }),
        ),
        makeSubscription(
          makeClient({ id: 2, name: 'Jorge Rengel', deliveryZone: 'Centro', groupToken: 'tok-1' }),
        ),
      ]);

      const result = await deliveryService.findRoute();

      expect(result['2026-06-23'].groups).toEqual([
        {
          groupToken: 'tok-1',
          members: [
            { id: 1, name: 'Carmen Tapia', phone: '+591 7000 0000', deliveryZone: 'Centro' },
            { id: 2, name: 'Jorge Rengel', phone: '+591 7000 0000', deliveryZone: 'Centro' },
          ],
        },
      ]);
    });

    it('represents a client without a groupToken as a group of one with groupToken null', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(
          makeClient({ id: 1, name: 'Ana López', deliveryZone: 'Sur', groupToken: null }),
        ),
      ]);

      const result = await deliveryService.findRoute();

      expect(result['2026-06-23'].groups).toEqual([
        {
          groupToken: null,
          members: [{ id: 1, name: 'Ana López', phone: '+591 7000 0000', deliveryZone: 'Sur' }],
        },
      ]);
    });

    it('lists groups before singles', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(makeClient({ id: 1, name: 'Single Client', groupToken: null })),
        makeSubscription(makeClient({ id: 2, name: 'Group Member', groupToken: 'tok-1' })),
      ]);

      const result = await deliveryService.findRoute();

      expect(result['2026-06-23'].groups.map((g) => g.groupToken)).toEqual(['tok-1', null]);
    });

    it('sorts singles alphabetically by name', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(makeClient({ id: 1, name: 'Zara Gomez' })),
        makeSubscription(makeClient({ id: 2, name: 'Ana López' })),
      ]);

      const result = await deliveryService.findRoute();

      const names = result['2026-06-23'].groups.map((g) => g.members[0].name);
      expect(names).toEqual(['Ana López', 'Zara Gomez']);
    });

    it('keeps each member tagged with its own deliveryZone', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(
          makeClient({ id: 1, name: 'Sur Client', deliveryZone: 'Sur', groupToken: null }),
        ),
      ]);

      const result = await deliveryService.findRoute();

      expect(result['2026-06-23'].groups[0].members[0].deliveryZone).toBe('Sur');
    });
  });
});
