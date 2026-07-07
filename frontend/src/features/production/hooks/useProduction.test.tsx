import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useProduction } from '@/features/production/hooks/useProduction';
import type { ProductionData } from '@/features/production/types';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

const summary: ProductionData = {
  date: '2026-07-02',
  isDeliveryDay: true,
  total: 2,
  groups: {
    juice: ['Ana Flores'],
    lunchOnly: ['Ana Flores'],
    lunchAndDinner: ['Carlos Ríos'],
    full: [],
  },
  weeklyCounts: {
    weekStart: '2026-06-29',
    weekEnd: '2026-07-03',
    days: [
      { date: '2026-06-29', count: 10 },
      { date: '2026-06-30', count: 11 },
      { date: '2026-07-01', count: 12 },
      { date: '2026-07-02', count: 9 },
      { date: '2026-07-03', count: 8 },
    ],
  },
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useProduction', () => {
  it('returns null summary while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useProduction(), { wrapper: makeWrapper() });

    expect(result.current.summary).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches the summary from GET /production', async () => {
    mockGet.mockResolvedValue(summary);

    const { result } = renderHook(() => useProduction(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/production');
    expect(result.current.summary).toEqual(summary);
  });

  it('exposes the query error', async () => {
    mockGet.mockRejectedValue(new Error('falló'));

    const { result } = renderHook(() => useProduction(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.summary).toBeNull();
  });
});
