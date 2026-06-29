import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useDeliveryRoute } from '@/features/delivery/hooks/useDeliveryRoute';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn() },
}));

const mockGet = api.get as jest.Mock;

const response = {
  '2026-06-25': { zones: [{ zone: 'Sur', entregas: 1, groups: [], singles: [] }] },
  '2026-06-26': { zones: [] },
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

describe('useDeliveryRoute', () => {
  it('isLoading is true initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useDeliveryRoute(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes the first date key as today and the second as tomorrow', async () => {
    mockGet.mockResolvedValue(response);
    const { result } = renderHook(() => useDeliveryRoute(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.todayDate).toBe('2026-06-25');
    expect(result.current.tomorrowDate).toBe('2026-06-26');
    expect(result.current.today?.zones).toHaveLength(1);
    expect(result.current.tomorrow?.zones).toEqual([]);
  });

  it('calls GET /delivery', async () => {
    mockGet.mockResolvedValue(response);
    renderHook(() => useDeliveryRoute(), { wrapper: makeWrapper() });

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/delivery'));
  });

  it('returns undefined dates and days before data arrives', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useDeliveryRoute(), { wrapper: makeWrapper() });

    expect(result.current.todayDate).toBeUndefined();
    expect(result.current.today).toBeUndefined();
  });
});
