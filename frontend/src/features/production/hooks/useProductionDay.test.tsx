import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useProductionDay } from '@/features/production/hooks/useProductionDay';
import type { DayClients } from '@/features/production/types';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

const dayClients: DayClients = {
  date: '2026-07-16',
  count: 1,
  clients: [{ id: 'abc123', name: 'Ana Rojas', phoneNumber: '70123456', deliveryZone: 'Centro' }],
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useProductionDay', () => {
  it('fetches the day clients from GET /production/day', async () => {
    mockGet.mockResolvedValue(dayClients);

    const { result } = renderHook(() => useProductionDay('2026-07-16'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/production/day?date=2026-07-16');
    expect(result.current.dayClients).toEqual(dayClients);
  });

  it('does not fetch when date is null', () => {
    const { result } = renderHook(() => useProductionDay(null), { wrapper: makeWrapper() });

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.dayClients).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes the query error', async () => {
    mockGet.mockRejectedValue(new Error('falló'));

    const { result } = renderHook(() => useProductionDay('2026-07-16'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.dayClients).toBeNull();
  });
});
