import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useNutritionistQueue } from '@/features/evaluations/hooks/useNutritionistQueue';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockGet = api.get as jest.Mock;

const appointment1 = {
  id: '1',
  name: 'Ana Pérez',
  phone: '71234567',
  date: '2026-08-03',
  time: '09:00',
  subscriptionId: null,
  clientId: null,
  subscription: null,
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
  mockGet.mockImplementation((url: string) => {
    if (url === '/appointments/nutritionist') return Promise.resolve([appointment1]);
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
});

describe('useNutritionistQueue', () => {
  it('returns the queue after loading', async () => {
    const { result } = renderHook(() => useNutritionistQueue(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.appointments).toEqual([appointment1]);
  });

  it('isLoading is true initially', () => {
    const { result } = renderHook(() => useNutritionistQueue(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('does not fetch when enabled is false', () => {
    renderHook(() => useNutritionistQueue({ enabled: false }), { wrapper: makeWrapper() });
    expect(mockGet).not.toHaveBeenCalled();
  });
});
