import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useWeeklyCounts } from '@/features/production/hooks/useWeeklyCounts';
import type { WeeklyCounts } from '@/features/production/types';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

const makeWeek = (weekStart: string): WeeklyCounts => ({
  weekStart,
  weekEnd: '2026-07-24',
  days: [
    { date: weekStart, count: 10 },
    { date: '2026-07-21', count: 11 },
    { date: '2026-07-22', count: 12 },
    { date: '2026-07-23', count: 9 },
    { date: '2026-07-24', count: 8 },
  ],
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useWeeklyCounts', () => {
  it('fetches the requested week from GET /production/weekly-counts', async () => {
    const week = makeWeek('2026-07-20');
    mockGet.mockResolvedValue(week);

    const { result } = renderHook(() => useWeeklyCounts('2026-07-20', { enabled: true }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/production/weekly-counts?weekStart=2026-07-20');
    expect(result.current.weeklyCounts).toEqual(week);
  });

  it('serves seeded initial data without fetching when disabled', () => {
    const seeded = makeWeek('2026-07-13');

    const { result } = renderHook(
      () => useWeeklyCounts('2026-07-13', { enabled: false, initialData: seeded }),
      { wrapper: makeWrapper() },
    );

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.weeklyCounts).toEqual(seeded);
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes the query error', async () => {
    mockGet.mockRejectedValue(new Error('falló'));

    const { result } = renderHook(() => useWeeklyCounts('2026-07-27', { enabled: true }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.weeklyCounts).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
