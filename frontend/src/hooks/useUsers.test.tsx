import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { useUsers } from './useUsers';

jest.mock('../services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockDelete = api.delete as jest.Mock;

const user1 = { id: '1', username: 'ada', role: 'admin' as const };
const user2 = { id: '2', username: 'grace', role: 'kitchen' as const };

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
  mockGet.mockResolvedValue([user1, user2]);
});

describe('useUsers', () => {
  it('returns users after loading', async () => {
    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.users).toEqual([user1, user2]);
    expect(mockGet).toHaveBeenCalledWith('/users');
  });

  it('isLoading is true initially', () => {
    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  it('create calls POST /users', async () => {
    mockPost.mockResolvedValue({ id: '3', username: 'linus', role: 'delivery' });
    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() =>
      result.current.create({ username: 'linus', password: 'pass123', role: 'delivery' }),
    );

    expect(mockPost).toHaveBeenCalledWith('/users', {
      username: 'linus',
      password: 'pass123',
      role: 'delivery',
    });
  });

  it('update calls PATCH /users/:id', async () => {
    mockPatch.mockResolvedValue({ ...user1, username: 'ada2' });
    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.update('1', { username: 'ada2' }));

    expect(mockPatch).toHaveBeenCalledWith('/users/1', { username: 'ada2' });
  });

  it('remove calls DELETE /users/:id', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.remove('1'));

    expect(mockDelete).toHaveBeenCalledWith('/users/1');
  });
});
