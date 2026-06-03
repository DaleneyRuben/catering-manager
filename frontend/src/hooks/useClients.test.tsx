import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { useClients } from './useClients';

jest.mock('../services/api', () => ({
  default: { get: jest.fn(), getPaginated: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
const mockGetPaginated = api.getPaginated as jest.Mock;
const mockPost = api.post as jest.Mock;

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

describe('useClients', () => {
  it('isLoading is true initially', () => {
    mockGetPaginated.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns clients and total after loading', async () => {
    mockGetPaginated.mockResolvedValue({ data: [client1], total: 1, page: 1, limit: 20 });
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clients).toEqual([client1]);
    expect(result.current.total).toBe(1);
  });

  it('returns empty array and zero total before data arrives', () => {
    mockGetPaginated.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    expect(result.current.clients).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('passes page param in the query string', async () => {
    mockGetPaginated.mockResolvedValue({ data: [], total: 0, page: 2, limit: 20 });
    renderHook(() => useClients({ page: 2 }), { wrapper: makeWrapper() });
    await waitFor(() => expect(mockGetPaginated).toHaveBeenCalled());
    expect(mockGetPaginated).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });

  it('create calls POST /clients then POST /clients/:id/subscriptions', async () => {
    mockGetPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    mockPost.mockResolvedValueOnce({ id: 42 }).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.create(
      {
        name: 'Ana',
        sex: 'female',
        dateOfBirth: '1990-01-01',
        phoneNumber: '123',
        address: 'Calle 1',
        deliveryZone: 'Centro',
        delivery: 'La Oliva',
        underlyingDiseases: [],
        restrictions: [],
      },
      {
        planId: 1,
        startDate: '2026-06-01',
        contractDate: '2026-05-26',
        contractEndDate: '2026-06-27',
      },
    );

    expect(mockPost).toHaveBeenNthCalledWith(1, '/clients', {
      name: 'Ana',
      sex: 'female',
      dateOfBirth: '1990-01-01',
      phoneNumber: '123',
      address: 'Calle 1',
      deliveryZone: 'Centro',
      delivery: 'La Oliva',
      underlyingDiseases: [],
      restrictions: [],
    });
    expect(mockPost).toHaveBeenNthCalledWith(2, '/clients/42/subscriptions', {
      planId: 1,
      startDate: '2026-06-01',
      contractDate: '2026-05-26',
      contractEndDate: '2026-06-27',
    });
  });
});
