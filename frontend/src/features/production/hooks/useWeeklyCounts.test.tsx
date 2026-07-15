import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useWeeklyCounts } from '@/features/production/hooks/useWeeklyCounts';
import type { WeeklyCounts } from '@/features/production/types';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

const weeklyCounts: WeeklyCounts = {
  weekStart: '2026-07-20',
  weekEnd: '2026-07-24',
  days: [
    { date: '2026-07-20', count: 10 },
    { date: '2026-07-21', count: 11 },
    { date: '2026-07-22', count: 12 },
    { date: '2026-07-23', count: 9 },
    { date: '2026-07-24', count: 8 },
  ],
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useWeeklyCounts', () => {
  it('fetches the offset week from GET /production/weekly-counts', async () => {
    mockGet.mockResolvedValue(weeklyCounts);

    const { result } = renderHook(() => useWeeklyCounts(1), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/production/weekly-counts?offset=1');
    expect(result.current.weeklyCounts).toEqual(weeklyCounts);
  });

  it('does not fetch for offset 0 (the main production payload covers it)', () => {
    const { result } = renderHook(() => useWeeklyCounts(0), { wrapper: makeWrapper() });

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.weeklyCounts).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes the query error', async () => {
    mockGet.mockRejectedValue(new Error('falló'));

    const { result } = renderHook(() => useWeeklyCounts(2), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.weeklyCounts).toBeNull();
  });
});
