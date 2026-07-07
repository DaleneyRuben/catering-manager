import { findWeeklyCounts } from '../find-weekly-counts';
import { findActiveSubscriptionsForDate } from '../../subscription/find-active-subscriptions-for-date';

jest.mock('../../subscription/find-active-subscriptions-for-date', () => ({
  findActiveSubscriptionsForDate: jest.fn(),
}));

const mockGetCurrentMenuWeek = jest.fn(() => ({ start: '2026-06-29', end: '2026-07-03' }));
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  getCurrentMenuWeek: () => mockGetCurrentMenuWeek(),
}));

const mockCountsByDate: Record<string, number> = {
  '2026-06-29': 10,
  '2026-06-30': 11,
  '2026-07-01': 12,
  '2026-07-02': 9,
  '2026-07-03': 8,
};

describe('findWeeklyCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (findActiveSubscriptionsForDate as jest.Mock).mockImplementation((date: string) =>
      Promise.resolve(Array.from({ length: mockCountsByDate[date] ?? 0 })),
    );
  });

  it('returns the mon-fri bounds of the current display week', async () => {
    const result = await findWeeklyCounts();

    expect(result.weekStart).toBe('2026-06-29');
    expect(result.weekEnd).toBe('2026-07-03');
  });

  it('returns one entry per weekday with the active count for that date', async () => {
    const result = await findWeeklyCounts();

    expect(result.days).toEqual([
      { date: '2026-06-29', count: 10 },
      { date: '2026-06-30', count: 11 },
      { date: '2026-07-01', count: 12 },
      { date: '2026-07-02', count: 9 },
      { date: '2026-07-03', count: 8 },
    ]);
  });

  it('queries each weekday exactly once', async () => {
    await findWeeklyCounts();

    expect(findActiveSubscriptionsForDate).toHaveBeenCalledTimes(5);
  });

  it('delegates the week-start reset (e.g. sunday) to getCurrentMenuWeek', async () => {
    mockGetCurrentMenuWeek.mockReturnValueOnce({ start: '2026-07-06', end: '2026-07-10' });

    const result = await findWeeklyCounts();

    expect(result.weekStart).toBe('2026-07-06');
    expect(result.weekEnd).toBe('2026-07-10');
    expect(result.days[0].date).toBe('2026-07-06');
  });
});
