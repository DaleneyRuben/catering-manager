import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { usePendingPayment } from '@/features/evaluations/hooks/usePendingPayment';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockDelete = api.delete as jest.Mock;

const client1 = {
  id: '1',
  name: 'Ana Pérez',
  phoneNumber: '71234567',
  isExistingClientRenewal: false,
  subscriptions: [
    {
      id: '9',
      discount: 50,
      startDate: '2026-08-01',
      contractEndDate: '2026-08-28',
      paid: false,
      plan: { id: '2', name: 'Completo', price: 1200 },
    },
  ],
};

const client2 = { ...client1, id: '2', isExistingClientRenewal: true };

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
  mockGet.mockImplementation((url: string) => {
    if (url === '/evaluations/pending-payment') return Promise.resolve([client1]);
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
});

describe('usePendingPayment', () => {
  it('returns pending-payment clients after loading', async () => {
    const { result } = renderHook(() => usePendingPayment(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clients).toEqual([client1]);
  });

  it('isLoading is true initially', () => {
    const { result } = renderHook(() => usePendingPayment(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('markPaid calls POST /evaluations/:id/mark-paid', async () => {
    mockPost.mockResolvedValue({});
    const { result } = renderHook(() => usePendingPayment(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.markPaid('1');

    expect(mockPost).toHaveBeenCalledWith('/evaluations/1/mark-paid');
  });

  it('remove calls DELETE /evaluations/:id for a new-client conversion', async () => {
    mockDelete.mockResolvedValue({});
    const { result } = renderHook(() => usePendingPayment(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.remove(client1);

    expect(mockDelete).toHaveBeenCalledWith('/evaluations/1');
  });

  it('remove calls DELETE /evaluations/:id/pending-renewal for an existing-client renewal', async () => {
    mockDelete.mockResolvedValue({});
    const { result } = renderHook(() => usePendingPayment(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.remove(client2);

    expect(mockDelete).toHaveBeenCalledWith('/evaluations/2/pending-renewal');
  });
});
