import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useExpenseCategories, useExpenseMutations } from '@/features/finance/hooks/useExpenses';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useExpenseCategories', () => {
  it('fetches the catalog from GET /finance/categories', async () => {
    const categories = [{ id: 'AB12CD', name: 'Insumos', active: true }];
    mockApi.get.mockResolvedValue(categories);

    const { result } = renderHook(() => useExpenseCategories(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockApi.get).toHaveBeenCalledWith('/finance/categories');
    expect(result.current.categories).toEqual(categories);
  });

  it('starts as an empty list rather than undefined', () => {
    mockApi.get.mockResolvedValue([]);

    const { result } = renderHook(() => useExpenseCategories(), { wrapper: makeWrapper() });

    expect(result.current.categories).toEqual([]);
  });
});

describe('useExpenseMutations', () => {
  const input = { amount: 120, categoryId: 'AB12CD', spentAt: '2026-08-04', description: null };

  it('creates an expense through POST /finance/expenses', async () => {
    mockApi.post.mockResolvedValue({ id: 'EF34GH' });

    const { result } = renderHook(() => useExpenseMutations(), { wrapper: makeWrapper() });
    await result.current.create(input);

    expect(mockApi.post).toHaveBeenCalledWith('/finance/expenses', input);
  });

  it('updates an expense through PATCH /finance/expenses/:id', async () => {
    mockApi.patch.mockResolvedValue({ id: 'EF34GH' });

    const { result } = renderHook(() => useExpenseMutations(), { wrapper: makeWrapper() });
    await result.current.update('EF34GH', { amount: 200 });

    expect(mockApi.patch).toHaveBeenCalledWith('/finance/expenses/EF34GH', { amount: 200 });
  });

  it('deletes an expense through DELETE /finance/expenses/:id', async () => {
    mockApi.delete.mockResolvedValue({ deleted: true });

    const { result } = renderHook(() => useExpenseMutations(), { wrapper: makeWrapper() });
    await result.current.remove('EF34GH');

    expect(mockApi.delete).toHaveBeenCalledWith('/finance/expenses/EF34GH');
  });

  // Every expense write moves the month's totals, so the register must not be left showing
  // figures that predate the change.
  it('invalidates the finance query after a write', async () => {
    mockApi.post.mockResolvedValue({ id: 'EF34GH' });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const spy = jest.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useExpenseMutations(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      ),
    });
    await result.current.create(input);

    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ['finance'] }));
  });
});
