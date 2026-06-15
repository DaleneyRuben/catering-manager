import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { useClientList } from './useClientList';
// create was extracted to useCreateClient — tested separately

jest.mock('../services/api', () => ({
  default: { get: jest.fn(), getPaginated: jest.fn(), patch: jest.fn() },
}));
const mockGetPaginated = api.getPaginated as jest.Mock;

const client1 = {
  id: 1,
  name: 'María García',
  subscriptions: [],
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

describe('useClientList', () => {
  it('isLoading is true initially', () => {
    mockGetPaginated.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClientList(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns clients and total after loading', async () => {
    mockGetPaginated.mockResolvedValue({ data: [client1], total: 1, page: 1, limit: 20 });
    const { result } = renderHook(() => useClientList(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clients).toEqual([client1]);
    expect(result.current.total).toBe(1);
  });

  it('returns empty array and zero total before data arrives', () => {
    mockGetPaginated.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClientList(), { wrapper: makeWrapper() });
    expect(result.current.clients).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('passes page param in the query string', async () => {
    mockGetPaginated.mockResolvedValue({ data: [], total: 0, page: 2, limit: 25 });
    renderHook(() => useClientList({ page: 2 }), { wrapper: makeWrapper() });
    await waitFor(() => expect(mockGetPaginated).toHaveBeenCalled());
    expect(mockGetPaginated).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });

  it('passes limit param in the query string', async () => {
    mockGetPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
    renderHook(() => useClientList({ limit: 10 }), { wrapper: makeWrapper() });
    await waitFor(() => expect(mockGetPaginated).toHaveBeenCalled());
    expect(mockGetPaginated).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
  });
});
