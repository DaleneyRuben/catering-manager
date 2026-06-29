import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useHealth } from '@/features/health/hooks/useHealth';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn() },
}));

const mockGet = api.get as jest.Mock;

const report = {
  status: 'ok' as const,
  checkedAt: '2026-06-22T20:00:00.000Z',
  services: [
    { name: 'API La Oliva', status: 'ok' as const, latencyMs: 1 },
    { name: 'Base de datos', status: 'ok' as const, latencyMs: 5 },
  ],
  process: { uptimeSeconds: 120, memoryUsedMb: 80 },
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
  mockGet.mockResolvedValue(report);
});

describe('useHealth', () => {
  it('returns the report after loading', async () => {
    const { result } = renderHook(() => useHealth(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.report).toEqual(report);
    expect(mockGet).toHaveBeenCalledWith('/health');
  });

  it('isLoading is true initially', () => {
    const { result } = renderHook(() => useHealth(), { wrapper: makeWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  it('refresh refetches the report', async () => {
    const { result } = renderHook(() => useHealth(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGet.mockClear();
    await act(() => result.current.refresh());

    expect(mockGet).toHaveBeenCalledWith('/health');
  });
});
