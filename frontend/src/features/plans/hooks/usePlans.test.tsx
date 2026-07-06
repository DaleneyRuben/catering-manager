import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { usePlans } from '@/features/plans/hooks/usePlans';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockDelete = api.delete as jest.Mock;

const plan1 = { id: 1, name: 'Completo', meals: ['lunch'], price: 1200, discount: 0 };
const plan2 = { id: 2, name: 'Ligero', meals: ['breakfast'], price: 600, discount: 0 };

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
    if (url === '/plans') return Promise.resolve([plan1, plan2]);
    if (url === '/plans/client-counts') return Promise.resolve([]);
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
});

describe('usePlans', () => {
  it('returns plans after loading', async () => {
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plans).toEqual([plan1, plan2]);
  });

  it('normalizes price to a number when the API returns a decimal string', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/plans') return Promise.resolve([{ ...plan1, price: '1200.00' }]);
      if (url === '/plans/client-counts') return Promise.resolve([]);
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plans[0].price).toBe(1200);
  });

  it('isLoading is true initially', () => {
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('save calls PATCH /plans/:id', async () => {
    mockPatch.mockResolvedValue({ ...plan1, name: 'Completo Plus' });
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.save(1, { name: 'Completo Plus', meals: ['lunch'], price: '1200' });

    expect(mockPatch).toHaveBeenCalledWith('/plans/1', {
      name: 'Completo Plus',
      meals: ['lunch'],
      price: 1200,
    });
  });

  it('create calls POST /plans', async () => {
    mockPost.mockResolvedValue({ id: 3, name: 'Nuevo', meals: [], price: 500 });
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.create({ name: 'Nuevo', meals: [], price: '500' });

    expect(mockPost).toHaveBeenCalledWith('/plans', { name: 'Nuevo', meals: [], price: 500 });
  });

  it('isCreating is true while POST is in flight', async () => {
    mockPost.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isCreating).toBe(false);
    result.current.create({ name: 'Nuevo', meals: [], price: '500' });

    await waitFor(() => expect(result.current.isCreating).toBe(true));
  });

  it('remove calls DELETE /plans/:id', async () => {
    mockDelete.mockResolvedValue({});
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.remove(1);

    expect(mockDelete).toHaveBeenCalledWith('/plans/1');
  });

  it('clientCounts is built from the /plans/client-counts array, keyed by planId', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/plans') return Promise.resolve([plan1]);
      if (url === '/plans/client-counts') return Promise.resolve([{ planId: '1', count: 2 }]);
      return Promise.reject(new Error(`Unknown: ${url}`));
    });

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.clientCounts).toEqual({ 1: 2 });
  });
});
