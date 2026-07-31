import { findDayClients } from '../find-day-clients';
import { findActiveSubscriptionsForDate } from '../../subscription/find-active-subscriptions-for-date';

jest.mock('../../subscription/find-active-subscriptions-for-date', () => ({
  findActiveSubscriptionsForDate: jest.fn(),
}));

const makeSubscription = (id: number, name: string, phoneNumber: string, deliveryZone: string) => ({
  client: { id, name, phoneNumber, deliveryZone },
});

const mockSubscriptions = (subs: ReturnType<typeof makeSubscription>[]) =>
  (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue(subs);

describe('findDayClients', () => {
  beforeEach(() => jest.clearAllMocks());

  it('queries active subscriptions for the given date', async () => {
    mockSubscriptions([]);

    const result = await findDayClients('2026-07-16');

    expect(findActiveSubscriptionsForDate).toHaveBeenCalledWith('2026-07-16');
    expect(result).toEqual({ date: '2026-07-16', count: 0, clients: [] });
  });

  it('returns id, name, phone and zone per active client', async () => {
    mockSubscriptions([makeSubscription(7, 'Ana Rojas', '70123456', 'Centro')]);

    const result = await findDayClients('2026-07-16');

    expect(result.count).toBe(1);
    expect(result.clients).toEqual([
      { id: 7, name: 'Ana Rojas', phoneNumber: '70123456', deliveryZone: 'Centro' },
    ]);
  });

  it('sorts clients by name with spanish collation', async () => {
    mockSubscriptions([
      makeSubscription(1, 'Óscar Paz', '70000001', 'Sur'),
      makeSubscription(2, 'Ana Rojas', '70000002', 'Centro'),
      makeSubscription(3, 'Nadia Soto', '70000003', 'Sur'),
    ]);

    const result = await findDayClients('2026-07-16');

    expect(result.clients.map((c) => c.name)).toEqual(['Ana Rojas', 'Nadia Soto', 'Óscar Paz']);
  });
});
