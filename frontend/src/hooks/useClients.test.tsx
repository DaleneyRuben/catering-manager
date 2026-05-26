import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { useClients } from './useClients';

jest.mock('../services/api', () => ({
  default: { get: jest.fn() },
}));
const mockGet = api.get as jest.Mock;

const client1 = {
  id: 1,
  name: 'María García',
  subscriptions: [],
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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
    mockGet.mockResolvedValue({ data: { data: [client1] } });
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clients).toEqual([client1]);
  });

  it('returns empty array before data arrives', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClients(), { wrapper: makeWrapper() });
    expect(result.current.clients).toEqual([]);
  });
});
