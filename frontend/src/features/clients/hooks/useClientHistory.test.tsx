import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useClientHistory } from '@/features/clients/hooks/useClientHistory';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function ({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useClientHistory', () => {
  it('returns empty array while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClientHistory('1'), { wrapper: makeWrapper() });
    expect(result.current.history).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('returns history entries after loading', async () => {
    const entry = {
      id: '1',
      clientId: '1',
      eventType: 'paused',
      occurredAt: '2026-06-10',
      metadata: {},
    };
    mockGet.mockResolvedValue([entry]);
    const { result } = renderHook(() => useClientHistory('1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.history).toEqual([entry]);
  });

  it('fetches from the correct url', async () => {
    mockGet.mockResolvedValue([]);
    renderHook(() => useClientHistory('42'), { wrapper: makeWrapper() });
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/clients/42/history'));
  });
});
