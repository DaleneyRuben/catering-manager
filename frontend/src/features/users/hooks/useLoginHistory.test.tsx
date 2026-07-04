import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useLoginHistory, type LoginEntry } from '@/features/users/hooks/useLoginHistory';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

const entries: LoginEntry[] = [
  {
    deviceType: 'mobile',
    os: 'Android 14',
    browser: 'Chrome 126',
    createdAt: '2026-07-03T12:30:00.000Z',
  },
  { deviceType: null, os: null, browser: null, createdAt: '2026-07-01T08:00:00.000Z' },
];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useLoginHistory', () => {
  it('returns an empty list while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useLoginHistory('abc'), { wrapper: makeWrapper() });

    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches the history from GET /users/:id/logins', async () => {
    mockGet.mockResolvedValue(entries);

    const { result } = renderHook(() => useLoginHistory('abc'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/users/abc/logins');
    expect(result.current.entries).toEqual(entries);
  });

  it('exposes the query error', async () => {
    mockGet.mockRejectedValue(new Error('falló'));

    const { result } = renderHook(() => useLoginHistory('abc'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.entries).toEqual([]);
  });
});
