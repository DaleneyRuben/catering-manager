import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useMenu } from '@/features/menu/hooks/useMenu';

jest.mock('@/services/api', () => ({ default: { get: jest.fn(), put: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));
const mockGet = api.get as jest.Mock;
const mockPut = api.put as jest.Mock;

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function ({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useMenu', () => {
  it('returns empty array while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useMenu(), { wrapper: makeWrapper() });
    expect(result.current.menus).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('returns menus after loading', async () => {
    const menu = { id: '1', date: '2026-06-15', breakfast: 'Queque' };
    mockGet.mockResolvedValue([menu]);
    const { result } = renderHook(() => useMenu(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.menus).toEqual([menu]);
  });

  it('save calls PUT /menus with the draft', async () => {
    mockGet.mockResolvedValue([]);
    const saved = { id: '1', date: '2026-06-15', breakfast: 'Queque' };
    mockPut.mockResolvedValue(saved);
    const { result } = renderHook(() => useMenu(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const draft = { date: '2026-06-15', breakfast: 'Queque' };
    await act(async () => {
      await result.current.save(draft as never);
    });

    expect(mockPut).toHaveBeenCalledWith('/menus', draft);
  });

  it('isSaving is false after the mutation completes', async () => {
    mockGet.mockResolvedValue([]);
    mockPut.mockResolvedValue({});
    const { result } = renderHook(() => useMenu(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.save({} as never);
    });
    expect(result.current.isSaving).toBe(false);
  });
});
