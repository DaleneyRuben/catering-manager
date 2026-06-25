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

  it('resolves hoy to today and manana to the next calendar day on a weekday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-23'); // Tuesday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await deliveryService.findRoute();

    expect(result.hoy.date).toBe('2026-06-23');
    expect(result.manana.date).toBe('2026-06-24'); // Wednesday
  });

  it('returns no clients for hoy when today is a Saturday, without querying', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-27'); // Saturday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await deliveryService.findRoute();

    expect(result.hoy.date).toBe('2026-06-27');
    expect(result.hoy.clients).toEqual([]);
  });

  it('returns no clients for hoy when today is a Sunday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-28'); // Sunday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await deliveryService.findRoute();

    expect(result.hoy.clients).toEqual([]);
  });

  it('returns no clients for manana when tomorrow is a Saturday, while hoy still has data', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-26'); // Friday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await deliveryService.findRoute();

    expect(result.hoy.date).toBe('2026-06-26');
    expect(result.hoy.clients).toHaveLength(1);
    expect(result.manana.date).toBe('2026-06-27'); // Saturday
    expect(result.manana.clients).toEqual([]);
  });

  it('maps client fields for a weekday with active deliveries', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-23');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
      makeSubscription(
        makeClient({
          id: 7,
          name: 'Carmen Tapia',
          phoneNumber: '+591 7120 0934',
          deliveryZone: 'Centro',
          groupToken: 'tok-1',
        }),
      ),
    ]);

    const result = await deliveryService.findRoute();

    expect(result.hoy.clients).toEqual([
      {
        id: 7,
        name: 'Carmen Tapia',
        phoneNumber: '+591 7120 0934',
        deliveryZone: 'Centro',
        groupToken: 'tok-1',
      },
    ]);
  });

  it('returns an empty clients array when nothing matches on a weekday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-23');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await deliveryService.findRoute();

    expect(result.hoy.clients).toEqual([]);
    expect(result.manana.clients).toEqual([]);
  });

  it('formats the date label in Spanish, capitalized', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-23'); // Tuesday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await deliveryService.findRoute();

    expect(result.hoy.dateLabel).toBe('Martes 23 de junio, 2026');
  });

  it('formats the date label even for a weekend day with no clients', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-27'); // Saturday
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await deliveryService.findRoute();

    expect(result.hoy.dateLabel).toBe('Sábado 27 de junio, 2026');
  });
});
