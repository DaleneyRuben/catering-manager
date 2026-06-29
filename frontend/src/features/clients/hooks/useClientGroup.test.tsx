import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useClientGroup } from '@/features/clients/hooks/useClientGroup';
import type { GroupMember } from '@/features/clients/types';

jest.mock('@/services/api', () => ({
  default: { put: jest.fn(), get: jest.fn() },
}));
const mockPut = api.put as jest.Mock;

const ana: GroupMember = { id: '2', name: 'Ana' };
const bob: GroupMember = { id: '3', name: 'Bob' };

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useClientGroup', () => {
  it('initialises members from prop', () => {
    const { result } = renderHook(() => useClientGroup('1', [ana]), {
      wrapper: makeWrapper(),
    });
    expect(result.current.members).toEqual([ana]);
  });

  it('isDirty is false when members match initial', () => {
    const { result } = renderHook(() => useClientGroup('1', [ana]), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isDirty).toBe(false);
  });

  it('add appends a member and marks dirty', () => {
    const { result } = renderHook(() => useClientGroup('1', [ana]), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.add(bob));
    expect(result.current.members).toEqual([ana, bob]);
    expect(result.current.isDirty).toBe(true);
  });

  it('remove deletes a member by id and marks dirty', () => {
    const { result } = renderHook(() => useClientGroup('1', [ana, bob]), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.remove('2'));
    expect(result.current.members).toEqual([bob]);
    expect(result.current.isDirty).toBe(true);
  });

  it('does not add duplicate members', () => {
    const { result } = renderHook(() => useClientGroup('1', [ana]), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.add(ana));
    expect(result.current.members).toHaveLength(1);
  });

  it('save calls PUT /clients/:id/group with member ids', async () => {
    mockPut.mockResolvedValue({ groupMembers: [ana] });
    const { result } = renderHook(() => useClientGroup('1', [ana]), {
      wrapper: makeWrapper(),
    });
    await act(() => result.current.save());
    expect(mockPut).toHaveBeenCalledWith('/clients/1/group', { memberIds: ['2'] });
  });

  it('save with empty members sends empty memberIds', async () => {
    mockPut.mockResolvedValue({ groupMembers: [] });
    const { result } = renderHook(() => useClientGroup('1', []), {
      wrapper: makeWrapper(),
    });
    await act(() => result.current.save());
    expect(mockPut).toHaveBeenCalledWith('/clients/1/group', { memberIds: [] });
  });

  it('isDirty resets to false after successful save', async () => {
    mockPut.mockResolvedValue({ groupMembers: [ana, bob] });
    const { result } = renderHook(() => useClientGroup('1', [ana]), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.add(bob));
    expect(result.current.isDirty).toBe(true);
    await act(() => result.current.save());
    await waitFor(() => expect(result.current.isDirty).toBe(false));
  });
});
