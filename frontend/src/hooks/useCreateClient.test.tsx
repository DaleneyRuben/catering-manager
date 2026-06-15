import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { useCreateClient } from './useCreateClient';

jest.mock('../services/api', () => ({ default: { post: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));
const mockPost = api.post as jest.Mock;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return function({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
};
}

const clientDraft = {
  name: 'Ana López',
  sex: 'female',
  dateOfBirth: '1990-01-01',
  phoneNumber: '123',
  address: 'Calle 1',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  underlyingDiseases: [],
  restrictions: [],
};

const subscriptionDraft = {
  planId: 'plan-1',
  startDate: '2026-06-16',
  contractDate: '2026-06-15',
  duration: 20,
  discount: 0,
};

beforeEach(() => jest.clearAllMocks());

describe('useCreateClient', () => {
  it('posts to /clients then /clients/:id/subscriptions', async () => {
    mockPost.mockResolvedValueOnce({ id: 'client-42' }).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCreateClient(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.create(clientDraft, subscriptionDraft);
    });

    expect(mockPost).toHaveBeenNthCalledWith(1, '/clients', clientDraft);
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      '/clients/client-42/subscriptions',
      subscriptionDraft,
    );
  });

  it('isCreating starts as false', () => {
    const { result } = renderHook(() => useCreateClient(), { wrapper: makeWrapper() });
    expect(result.current.isCreating).toBe(false);
  });

  it('isCreating is false after successful create', async () => {
    mockPost.mockResolvedValueOnce({ id: 'client-1' }).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCreateClient(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.create(clientDraft, subscriptionDraft);
    });

    expect(result.current.isCreating).toBe(false);
  });

  it('throws when the first post fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('server error'));
    const { result } = renderHook(() => useCreateClient(), { wrapper: makeWrapper() });

    await expect(
      act(async () => {
        await result.current.create(clientDraft, subscriptionDraft);
      }),
    ).rejects.toThrow('server error');
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('invalidates clients query on success', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = jest.spyOn(qc, 'invalidateQueries');
    mockPost.mockResolvedValueOnce({ id: 'client-1' }).mockResolvedValueOnce(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateClient(), { wrapper });

    await act(async () => {
      await result.current.create(clientDraft, subscriptionDraft);
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['clients'] }));
  });
});
