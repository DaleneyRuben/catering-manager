import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useFinance } from '@/features/finance/hooks/useFinance';
import type { FinanceOverview } from '@/features/finance/types';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

const overview: FinanceOverview = {
  month: '2026-08',
  earliestMonth: '2026-07',
  income: 4050,
  expenses: 1200,
  balance: 2850,
  byCategory: [{ categoryId: 'AB12CD', categoryName: 'Insumos', total: 800 }],
  movements: [],
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useFinance', () => {
  it('fetches the requested month from GET /finance', async () => {
    mockGet.mockResolvedValue(overview);

    const { result } = renderHook(() => useFinance('2026-08'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08');
    expect(result.current.overview).toEqual(overview);
  });

  it('refetches when the selected month changes', async () => {
    mockGet.mockResolvedValue(overview);

    const { rerender } = renderHook(({ month }: { month: string }) => useFinance(month), {
      wrapper: makeWrapper(),
      initialProps: { month: '2026-08' },
    });

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08'));
    rerender({ month: '2026-07' });
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-07'));
  });

  it('exposes the query error', async () => {
    mockGet.mockRejectedValue(new Error('falló'));

    const { result } = renderHook(() => useFinance('2026-08'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.overview).toBeNull();
  });
});
