import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn() },
}));

const mockGet = api.get as jest.Mock;

const summary = {
  active: { today: 12, tomorrow: 15 },
  suspended: { today: 4, tomorrow: 3 },
  deliveriesToday: 9,
  contractEnding: { today: [], tomorrow: [] },
  birthdays: [],
  connections: [],
  menus: {
    today: { date: '2026-06-25', loaded: true },
    tomorrow: { date: '2026-06-26', loaded: false },
  },
};

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useDashboard', () => {
  it('isLoading is true initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useDashboard(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns the summary after loading', async () => {
    mockGet.mockResolvedValue(summary);
    const { result } = renderHook(() => useDashboard(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.summary).toEqual(summary);
  });

  it('calls GET /dashboard', async () => {
    mockGet.mockResolvedValue(summary);
    renderHook(() => useDashboard(), { wrapper: makeWrapper() });

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/dashboard'));
  });

  it('returns undefined summary before data arrives', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useDashboard(), { wrapper: makeWrapper() });

    expect(result.current.summary).toBeUndefined();
  });
});
