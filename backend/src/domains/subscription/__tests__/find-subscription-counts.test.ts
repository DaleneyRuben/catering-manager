import { findActiveSubscriptionsForDate } from '../find-active-subscriptions-for-date';
import { findSuspendedSubscriptionsForDate } from '../find-suspended-subscriptions-for-date';
import { findSubscriptionCounts } from '../find-subscription-counts';

jest.mock('../find-active-subscriptions-for-date', () => ({
  findActiveSubscriptionsForDate: jest.fn(),
}));
jest.mock('../find-suspended-subscriptions-for-date', () => ({
  findSuspendedSubscriptionsForDate: jest.fn(),
}));

const mockAppToday = jest.fn(() => '2026-06-25');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => mockAppToday(),
}));

describe('findSubscriptionCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns active and suspended counts as the length of each query result', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockImplementation((date: string) =>
      Promise.resolve(date === '2026-06-25' ? [{}, {}] : [{}]),
    );
    (findSuspendedSubscriptionsForDate as jest.Mock).mockImplementation((date: string) =>
      Promise.resolve(date === '2026-06-25' ? [] : [{}]),
    );

    const result = await findSubscriptionCounts();

    expect(result.active).toEqual({ today: 2, tomorrow: 1 });
    expect(result.suspended).toEqual({ today: 0, tomorrow: 1 });
  });

  it('shifts to monday/tuesday when today is saturday', async () => {
    mockAppToday.mockReturnValueOnce('2026-06-27');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);
    (findSuspendedSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    await findSubscriptionCounts();

    expect(findActiveSubscriptionsForDate).toHaveBeenCalledWith('2026-06-29');
    expect(findActiveSubscriptionsForDate).toHaveBeenCalledWith('2026-06-30');
    expect(findSuspendedSubscriptionsForDate).toHaveBeenCalledWith('2026-06-29');
    expect(findSuspendedSubscriptionsForDate).toHaveBeenCalledWith('2026-06-30');
  });

  it('propagates errors from the active-subscriptions query', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockRejectedValue(new Error('db error'));
    (findSuspendedSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    await expect(findSubscriptionCounts()).rejects.toThrow('db error');
  });
});
