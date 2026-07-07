import {
  findActiveSubscriptionsForDate,
  findSuspendedSubscriptionsForDate,
} from '../../subscription';
import { findCounts } from '../find-counts';

jest.mock('../../subscription', () => ({
  findActiveSubscriptionsForDate: jest.fn(),
  findSuspendedSubscriptionsForDate: jest.fn(),
}));

const mockAppToday = jest.fn(() => '2026-06-25');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => mockAppToday(),
}));

const makeSubscription = (groupToken: string | null = null) => ({
  client: { groupToken },
});

describe('findCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns active and suspended counts as the length of each query result', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockImplementation((date: string) =>
      Promise.resolve(
        date === '2026-06-25' ? [makeSubscription(), makeSubscription()] : [makeSubscription()],
      ),
    );
    (findSuspendedSubscriptionsForDate as jest.Mock).mockImplementation((date: string) =>
      Promise.resolve(date === '2026-06-25' ? [] : [makeSubscription()]),
    );

    const result = await findCounts();

    expect(result.active).toEqual({ today: 2, tomorrow: 1 });
    expect(result.suspended).toEqual({ today: 0, tomorrow: 1 });
  });

  it('shifts to monday/tuesday when today is saturday', async () => {
    mockAppToday.mockReturnValueOnce('2026-06-27');
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([]);
    (findSuspendedSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    await findCounts();

    expect(findActiveSubscriptionsForDate).toHaveBeenCalledWith('2026-06-29');
    expect(findActiveSubscriptionsForDate).toHaveBeenCalledWith('2026-06-30');
    expect(findSuspendedSubscriptionsForDate).toHaveBeenCalledWith('2026-06-29');
    expect(findSuspendedSubscriptionsForDate).toHaveBeenCalledWith('2026-06-30');
  });

  it('counts a shared groupToken as a single delivery', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
      makeSubscription('tok-1'),
      makeSubscription('tok-1'),
    ]);
    (findSuspendedSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await findCounts();

    expect(result.deliveriesToday).toBe(1);
  });

  it('counts each client without a groupToken as its own delivery', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue([
      makeSubscription(),
      makeSubscription(),
    ]);
    (findSuspendedSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    const result = await findCounts();

    expect(result.deliveriesToday).toBe(2);
  });

  it('propagates errors from the active-subscriptions query', async () => {
    (findActiveSubscriptionsForDate as jest.Mock).mockRejectedValue(new Error('db error'));
    (findSuspendedSubscriptionsForDate as jest.Mock).mockResolvedValue([]);

    await expect(findCounts()).rejects.toThrow('db error');
  });
});
