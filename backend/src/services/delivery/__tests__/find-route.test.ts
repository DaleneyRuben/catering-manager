import { findActiveSubscriptionsForDate } from '../../subscription/find-active-for-date';
import { findRoute } from '../find-route';

jest.mock('../../subscription/find-active-for-date', () => ({
  findActiveSubscriptionsForDate: jest.fn(),
}));
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { appToday } = require('../../../utils/date');

const makeClient = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  name: 'Ana López',
  phoneNumber: '+591 7000 0000',
  deliveryZone: 'Centro',
  groupToken: null,
  ...overrides,
});

const makeSubscription = (client = makeClient()) => ({ client });

describe('findRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keys the response by today and tomorrow as calendar dates on a weekday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-23');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await findRoute();

    expect(Object.keys(result)).toEqual(['2026-06-23', '2026-06-24']);
  });

  it('returns no zones for today when today is a Saturday, without querying', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-27');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await findRoute();

    expect(result['2026-06-27'].zones).toEqual([]);
    expect(findActiveSubscriptionsForDate).not.toHaveBeenCalledWith('2026-06-27');
  });

  it('returns no zones for today when today is a Sunday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-28');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await findRoute();

    expect(result['2026-06-28'].zones).toEqual([]);
  });

  it('returns no zones for tomorrow when tomorrow is a Saturday, while today still has data', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-26');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([makeSubscription()]);

    const result = await findRoute();

    expect(result['2026-06-26'].zones).toHaveLength(1);
    expect(result['2026-06-27'].zones).toEqual([]);
  });

  it('returns an empty zones array when nothing matches on a weekday', async () => {
    (appToday as jest.Mock).mockReturnValue('2026-06-23');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await findRoute();

    expect(result['2026-06-23'].zones).toEqual([]);
    expect(result['2026-06-24'].zones).toEqual([]);
  });

  describe('zone/group clustering', () => {
    it('groups clients sharing a groupToken together within their zone', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(
          makeClient({ id: 1, name: 'Carmen Tapia', deliveryZone: 'Centro', groupToken: 'tok-1' }),
        ),
        makeSubscription(
          makeClient({ id: 2, name: 'Jorge Rengel', deliveryZone: 'Centro', groupToken: 'tok-1' }),
        ),
      ]);

      const result = await findRoute();

      const centro = result['2026-06-23'].zones.find((z) => z.zone === 'Centro');
      expect(centro?.groups).toEqual([
        {
          groupToken: 'tok-1',
          members: [
            { id: 1, name: 'Carmen Tapia', phone: '+591 7000 0000', deliveryZone: 'Centro' },
            { id: 2, name: 'Jorge Rengel', phone: '+591 7000 0000', deliveryZone: 'Centro' },
          ],
        },
      ]);
      expect(centro?.singles).toEqual([]);
    });

    it('puts clients without a groupToken into singles', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(makeClient({ id: 1, name: 'Ana López', groupToken: null })),
      ]);

      const result = await findRoute();

      const centro = result['2026-06-23'].zones.find((z) => z.zone === 'Centro');
      expect(centro?.groups).toEqual([]);
      expect(centro?.singles).toEqual([
        { id: 1, name: 'Ana López', phone: '+591 7000 0000', deliveryZone: 'Centro' },
      ]);
    });

    it('omits zones with no clients', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(makeClient({ deliveryZone: 'Centro' })),
      ]);

      const result = await findRoute();

      expect(result['2026-06-23'].zones.map((z) => z.zone)).toEqual(['Centro']);
    });

    it('orders zones as Sur then Centro', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(makeClient({ id: 1, name: 'Centro Client', deliveryZone: 'Centro' })),
        makeSubscription(makeClient({ id: 2, name: 'Sur Client', deliveryZone: 'Sur' })),
      ]);

      const result = await findRoute();

      expect(result['2026-06-23'].zones.map((z) => z.zone)).toEqual(['Sur', 'Centro']);
    });

    it('sorts singles alphabetically by name', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(makeClient({ id: 1, name: 'Zara Gomez' })),
        makeSubscription(makeClient({ id: 2, name: 'Ana López' })),
      ]);

      const result = await findRoute();

      const centro = result['2026-06-23'].zones.find((z) => z.zone === 'Centro');
      expect(centro?.singles.map((s) => s.name)).toEqual(['Ana López', 'Zara Gomez']);
    });

    it('counts entregas as groups.length + singles.length', async () => {
      (appToday as jest.Mock).mockReturnValue('2026-06-23');
      (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
        makeSubscription(makeClient({ id: 1, name: 'A', groupToken: 'tok-1' })),
        makeSubscription(makeClient({ id: 2, name: 'B', groupToken: 'tok-1' })),
        makeSubscription(makeClient({ id: 3, name: 'C', groupToken: null })),
        makeSubscription(makeClient({ id: 4, name: 'D', groupToken: null })),
      ]);

      const result = await findRoute();

      const centro = result['2026-06-23'].zones.find((z) => z.zone === 'Centro');
      expect(centro?.entregas).toBe(3);
    });
  });
});
