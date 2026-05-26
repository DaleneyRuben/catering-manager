import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { useClients } from './useClients';

jest.mock('../services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
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
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns clients after loading', async () => {
    mockGet.mockResolvedValue([client1]);
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clients).toEqual([client1]);
  });

  it('returns empty array before data arrives', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    expect(result.current.clients).toEqual([]);
  });

  it('create calls POST /clients then POST /clients/:id/subscriptions', async () => {
    mockGet.mockResolvedValue([]);
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
        zone: 'Centro',
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
      zone: 'Centro',
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
