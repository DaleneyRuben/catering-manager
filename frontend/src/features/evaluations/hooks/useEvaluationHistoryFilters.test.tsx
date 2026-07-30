import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useEvaluationHistoryFilters } from './useEvaluationHistoryFilters';

jest.mock('@/services/api', () => ({ default: { getPaginated: jest.fn() } }));
const mockGetPaginated = api.getPaginated as jest.Mock;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

const emptyResponse = { data: [], total: 0, page: 1, limit: 25 };

describe('useEvaluationHistoryFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPaginated.mockResolvedValue(emptyResponse);
  });

  it('defaults to all statuses, page 1, limit 25, no search or date range', () => {
    const { result } = renderHook(() => useEvaluationHistoryFilters(), { wrapper: makeWrapper() });
    expect(result.current.status).toBe('all');
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(25);
    expect(result.current.q).toBe('');
    expect(result.current.dateFrom).toBe('');
    expect(result.current.dateTo).toBe('');
  });

  it('resets to page 1 when the status filter changes', async () => {
    const { result } = renderHook(() => useEvaluationHistoryFilters(), { wrapper: makeWrapper() });
    act(() => result.current.changePage(3));
    await waitFor(() => expect(result.current.page).toBe(3));

    act(() => result.current.changeStatus('pagado'));
    await waitFor(() => expect(result.current.status).toBe('pagado'));
    expect(result.current.page).toBe(1);
  });

  it('resets to page 1 when the page size changes', async () => {
    const { result } = renderHook(() => useEvaluationHistoryFilters(), { wrapper: makeWrapper() });
    act(() => result.current.changePage(2));
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.changeLimit(50));
    await waitFor(() => expect(result.current.limit).toBe(50));
    expect(result.current.page).toBe(1);
  });

  it('resets to page 1 when the date range changes', async () => {
    const { result } = renderHook(() => useEvaluationHistoryFilters(), { wrapper: makeWrapper() });
    act(() => result.current.changePage(2));
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.setDateFrom('2026-08-01'));
    await waitFor(() => expect(result.current.dateFrom).toBe('2026-08-01'));
    expect(result.current.page).toBe(1);
  });

  it('exposes appointments and total from the underlying query', async () => {
    mockGetPaginated.mockResolvedValue({
      data: [{ id: '1', name: 'Julia Cuentas' }],
      total: 1,
      page: 1,
      limit: 25,
    });
    const { result } = renderHook(() => useEvaluationHistoryFilters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.appointments).toHaveLength(1));
    expect(result.current.total).toBe(1);
  });

  it('forwards the debounced search term to the query', async () => {
    renderHook(() => useEvaluationHistoryFilters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(mockGetPaginated).toHaveBeenCalled());
    expect(mockGetPaginated).toHaveBeenCalledWith(expect.not.stringContaining('q='));
  });
});
