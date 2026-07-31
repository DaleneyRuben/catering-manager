import { findActiveSubscriptionsForDate } from '../../subscription/find-active-subscriptions-for-date';
import { countDeliveriesToday } from '../count-deliveries-today';

jest.mock('../../subscription/find-active-subscriptions-for-date', () => ({
  findActiveSubscriptionsForDate: jest.fn(),
}));

const mockAppToday = jest.fn(() => '2026-06-25');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => mockAppToday(),
}));

const makeSubscription = (groupToken: string | null = null) => ({
  client: { groupToken },
});

describe('countDeliveriesToday', () => {
  beforeEach(() => jest.clearAllMocks());

  it('counts each client without a groupToken as its own delivery', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
      makeSubscription(),
      makeSubscription(),
    ]);

    await expect(countDeliveriesToday()).resolves.toBe(2);
  });

  it('counts a shared groupToken as a single delivery', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
      makeSubscription('tok-1'),
      makeSubscription('tok-1'),
    ]);

    await expect(countDeliveriesToday()).resolves.toBe(1);
  });

  it('counts two groups and an individual as three deliveries', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
      makeSubscription('tok-1'),
      makeSubscription('tok-1'),
      makeSubscription('tok-2'),
      makeSubscription('tok-2'),
      makeSubscription('tok-2'),
      makeSubscription(),
    ]);

    await expect(countDeliveriesToday()).resolves.toBe(3);
  });

  it('returns zero when nobody is active', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    await expect(countDeliveriesToday()).resolves.toBe(0);
  });

  it('counts the next delivery day when today is saturday', async () => {
    mockAppToday.mockReturnValueOnce('2026-06-27');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    await countDeliveriesToday();

    expect(findActiveSubscriptionsForDate).toHaveBeenCalledWith('2026-06-29');
  });

  it('propagates errors from the active-subscriptions query', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(countDeliveriesToday()).rejects.toThrow('db error');
  });
});
