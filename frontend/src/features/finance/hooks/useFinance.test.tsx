import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useFinance } from '@/features/finance/hooks/useFinance';
import type { FinanceOverview, MovementFilters } from '@/features/finance/types';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

const overview: FinanceOverview = {
  month: '2026-08',
  earliestMonth: '2026-07',
  income: 4050,
  expenses: 1200,
  balance: 2850,
  incomeCount: 3,
  expenseCount: 1,
  count: 4,
  subtotal: 2850,
  byCategory: [{ categoryId: 'AB12CD', categoryName: 'Insumos', total: 800, active: true }],
  movements: [],
};

const NO_FILTERS: MovementFilters = { q: '', direction: 'all', categoryId: '' };

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

    const { result } = renderHook(() => useFinance('2026-08', NO_FILTERS), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08');
    expect(result.current.overview).toEqual(overview);
  });

  it('refetches when the selected month changes', async () => {
    mockGet.mockResolvedValue(overview);

    const { rerender } = renderHook(
      ({ month }: { month: string }) => useFinance(month, NO_FILTERS),
      {
        wrapper: makeWrapper(),
        initialProps: { month: '2026-08' },
      },
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08'));
    rerender({ month: '2026-07' });
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-07'));
  });

  it('sends the direction only when one side is asked for', async () => {
    mockGet.mockResolvedValue(overview);

    renderHook(() => useFinance('2026-08', { ...NO_FILTERS, direction: 'expense' }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08&direction=expense'),
    );
  });

  it('sends the category filter', async () => {
    mockGet.mockResolvedValue(overview);

    renderHook(() => useFinance('2026-08', { ...NO_FILTERS, categoryId: 'AB12CD' }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08&categoryId=AB12CD'),
    );
  });

  // The term reaches the query encoded — "verdulería" carries an accent and a person searching for
  // a row is as likely to type "&" or a space as anything else.
  it('encodes the search term', async () => {
    mockGet.mockResolvedValue(overview);

    renderHook(() => useFinance('2026-08', { ...NO_FILTERS, q: 'pollo & verdulería' }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        '/finance?month=2026-08&q=pollo%20%26%20verduler%C3%ADa',
      ),
    );
  });

  // A term of spaces narrows nothing, and asking the server for it would empty the list for what
  // reads to the user as an untouched field.
  it('ignores a search term that is only whitespace', async () => {
    mockGet.mockResolvedValue(overview);

    renderHook(() => useFinance('2026-08', { ...NO_FILTERS, q: '   ' }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08'));
  });

  it('refetches when a filter changes', async () => {
    mockGet.mockResolvedValue(overview);

    const { rerender } = renderHook(
      ({ filters }: { filters: MovementFilters }) => useFinance('2026-08', filters),
      { wrapper: makeWrapper(), initialProps: { filters: NO_FILTERS } },
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08'));
    rerender({ filters: { ...NO_FILTERS, direction: 'income' } });
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/finance?month=2026-08&direction=income'),
    );
  });

  it('exposes the query error', async () => {
    mockGet.mockRejectedValue(new Error('falló'));

    const { result } = renderHook(() => useFinance('2026-08', NO_FILTERS), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.overview).toBeNull();
  });
});
