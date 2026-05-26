import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { usePlans } from './usePlans';

jest.mock('../services/api', () => ({
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
    if (url === '/plans') return Promise.resolve({ data: { data: [plan1, plan2] } });
    if (url === '/clients') return Promise.resolve({ data: { data: [] } });
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
});

describe('usePlans', () => {
  it('returns plans after loading', async () => {
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plans).toEqual([plan1, plan2]);
  });

  it('isLoading is true initially', () => {
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('save calls PATCH /plans/:id', async () => {
    mockPatch.mockResolvedValue({ data: { data: { ...plan1, name: 'Completo Plus' } } });
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
    mockPost.mockResolvedValue({ data: { data: { id: 3, name: 'Nuevo', meals: [], price: 500 } } });
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.create({ name: 'Nuevo', meals: [], price: '500' });

    expect(mockPost).toHaveBeenCalledWith('/plans', { name: 'Nuevo', meals: [], price: 500 });
  });

  it('remove calls DELETE /plans/:id', async () => {
    mockDelete.mockResolvedValue({});
    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.remove(1);

    expect(mockDelete).toHaveBeenCalledWith('/plans/1');
  });

  it('clientCounts is derived from clients data', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/plans') return Promise.resolve({ data: { data: [plan1] } });
      if (url === '/clients')
        return Promise.resolve({
          data: {
            data: [{ subscriptions: [{ planId: 1 }] }, { subscriptions: [{ planId: 1 }] }],
          },
        });
      return Promise.reject(new Error(`Unknown: ${url}`));
    });

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.clientCounts).toEqual({ 1: 2 });
  });
});
