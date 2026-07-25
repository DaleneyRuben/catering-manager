import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useConvertAppointment } from '@/features/evaluations/hooks/useConvertAppointment';

jest.mock('@/services/api', () => ({ default: { post: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));
const mockPost = api.post as jest.Mock;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return function ({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
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
  paid: true,
};

beforeEach(() => jest.clearAllMocks());

describe('useConvertAppointment', () => {
  it('posts to /appointments/:id/convert with client and subscription', async () => {
    mockPost.mockResolvedValueOnce({ client: { id: 'client-1' } });
    const { result } = renderHook(() => useConvertAppointment(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.convert('appt-1', clientDraft, subscriptionDraft);
    });

    expect(mockPost).toHaveBeenCalledWith('/appointments/appt-1/convert', {
      client: clientDraft,
      subscription: subscriptionDraft,
    });
  });

  it('isConverting is false after successful conversion', async () => {
    mockPost.mockResolvedValueOnce({ client: { id: 'client-1' } });
    const { result } = renderHook(() => useConvertAppointment(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.convert('appt-1', clientDraft, subscriptionDraft);
    });

    expect(result.current.isConverting).toBe(false);
  });

  it('throws when the request fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('server error'));
    const { result } = renderHook(() => useConvertAppointment(), { wrapper: makeWrapper() });

    await expect(
      act(async () => {
        await result.current.convert('appt-1', clientDraft, subscriptionDraft);
      }),
    ).rejects.toThrow('server error');
  });

  it('invalidates the nutritionist queue on success', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = jest.spyOn(qc, 'invalidateQueries');
    mockPost.mockResolvedValueOnce({ client: { id: 'client-1' } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useConvertAppointment(), { wrapper });

    await act(async () => {
      await result.current.convert('appt-1', clientDraft, subscriptionDraft);
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['appointments'] }));
  });
});
