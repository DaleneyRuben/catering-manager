import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useClientListFilters } from './useClientListFilters';

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

describe('useClientListFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPaginated.mockResolvedValue(emptyResponse);
  });

  it('defaults to all clients, page 1, limit 25', () => {
    const { result } = renderHook(() => useClientListFilters(), { wrapper: makeWrapper() });
    expect(result.current.filter).toBe('all');
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(25);
  });

  it('resets to page 1 when the status filter changes', async () => {
    const { result } = renderHook(() => useClientListFilters(), { wrapper: makeWrapper() });
    act(() => result.current.changePage(3));
    await waitFor(() => expect(result.current.page).toBe(3));

    act(() => result.current.changeFilter('active'));
    await waitFor(() => expect(result.current.filter).toBe('active'));
    expect(result.current.page).toBe(1);
  });

  it('resets to page 1 when the page size changes', async () => {
    const { result } = renderHook(() => useClientListFilters(), { wrapper: makeWrapper() });
    act(() => result.current.changePage(2));
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.changeLimit(50));
    await waitFor(() => expect(result.current.limit).toBe(50));
    expect(result.current.page).toBe(1);
  });

  it('does not reset the filter when the page changes', async () => {
    const { result } = renderHook(() => useClientListFilters(), { wrapper: makeWrapper() });
    act(() => result.current.changeFilter('paused'));
    await waitFor(() => expect(result.current.filter).toBe('paused'));

    act(() => result.current.changePage(2));
    await waitFor(() => expect(result.current.page).toBe(2));
    expect(result.current.filter).toBe('paused');
  });

  it('exposes clients and total from the underlying query', async () => {
    mockGetPaginated.mockResolvedValue({
      data: [{ id: 1, name: 'Ada' }],
      total: 1,
      page: 1,
      limit: 25,
    });
    const { result } = renderHook(() => useClientListFilters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.clients).toHaveLength(1));
    expect(result.current.total).toBe(1);
  });
});
