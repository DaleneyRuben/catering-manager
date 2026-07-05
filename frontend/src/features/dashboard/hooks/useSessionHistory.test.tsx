import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useSessionHistory, type SessionEntry } from '@/features/dashboard/hooks/useSessionHistory';

jest.mock('@/services/api', () => ({ default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

const entries: SessionEntry[] = [
  {
    username: 'merlyn',
    role: 'kitchen',
    deviceType: 'mobile',
    os: 'Android',
    browser: 'Chrome 149',
    createdAt: '2026-07-04T10:29:00.000Z',
  },
  {
    username: 'daleney',
    role: 'super_admin',
    deviceType: null,
    os: null,
    browser: null,
    createdAt: '2026-07-03T07:58:00.000Z',
  },
];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useSessionHistory', () => {
  it('returns an empty list while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSessionHistory(), { wrapper: makeWrapper() });

    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches the sessions from GET /dashboard/sessions', async () => {
    mockGet.mockResolvedValue(entries);

    const { result } = renderHook(() => useSessionHistory(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/dashboard/sessions');
    expect(result.current.entries).toEqual(entries);
  });

  it('exposes the query error', async () => {
    mockGet.mockRejectedValue(new Error('falló'));

    const { result } = renderHook(() => useSessionHistory(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.entries).toEqual([]);
  });
});
