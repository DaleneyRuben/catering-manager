import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useEvaluationHistory } from '@/features/evaluations/hooks/useEvaluationHistory';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), getPaginated: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
const mockGetPaginated = api.getPaginated as jest.Mock;

const appointment1 = {
  id: '1',
  name: 'Julia Cuentas',
  phone: '76441120',
  date: '2026-06-12',
  time: '16:00',
  subscriptionId: '9',
  clientId: null,
  subscription: { paid: true },
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useEvaluationHistory', () => {
  it('isLoading is true initially', () => {
    mockGetPaginated.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useEvaluationHistory(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns appointments and total after loading', async () => {
    mockGetPaginated.mockResolvedValue({ data: [appointment1], total: 1, page: 1, limit: 25 });
    const { result } = renderHook(() => useEvaluationHistory(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.appointments).toEqual([appointment1]);
    expect(result.current.total).toBe(1);
  });

  it('returns an empty array and zero total before data arrives', () => {
    mockGetPaginated.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useEvaluationHistory(), { wrapper: makeWrapper() });
    expect(result.current.appointments).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('fetches the history endpoint', async () => {
    mockGetPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 25 });
    renderHook(() => useEvaluationHistory(), { wrapper: makeWrapper() });
    await waitFor(() => expect(mockGetPaginated).toHaveBeenCalled());
    expect(mockGetPaginated).toHaveBeenCalledWith(
      expect.stringContaining('/appointments/nutritionist/history'),
    );
  });

  it('passes status, q, dateFrom, dateTo, page, and limit in the query string', async () => {
    mockGetPaginated.mockResolvedValue({ data: [], total: 0, page: 2, limit: 10 });
    renderHook(
      () =>
        useEvaluationHistory({
          status: 'pagado',
          q: 'Julia',
          dateFrom: '2026-08-01',
          dateTo: '2026-08-10',
          page: 2,
          limit: 10,
        }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(mockGetPaginated).toHaveBeenCalled());
    const url = mockGetPaginated.mock.calls[0][0];
    expect(url).toContain('status=pagado');
    expect(url).toContain('q=Julia');
    expect(url).toContain('dateFrom=2026-08-01');
    expect(url).toContain('dateTo=2026-08-10');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });

  it('omits the status param when status is "all"', async () => {
    mockGetPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 25 });
    renderHook(() => useEvaluationHistory({ status: 'all' }), { wrapper: makeWrapper() });
    await waitFor(() => expect(mockGetPaginated).toHaveBeenCalled());
    expect(mockGetPaginated).toHaveBeenCalledWith(expect.not.stringContaining('status='));
  });
});
