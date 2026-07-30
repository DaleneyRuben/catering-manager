import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useAppointment } from '@/features/evaluations/hooks/useAppointment';

jest.mock('@/services/api', () => ({ default: { get: jest.fn(), post: jest.fn() } }));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function ({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const appointment = {
  id: 'appt-1',
  name: 'Fernando Daleney',
  phone: '76637732',
  date: '2026-08-03',
  time: '09:00',
  subscriptionId: null,
  clientId: 'client-5',
};

const renewalPayload = {
  planId: 'plan-2',
  contractDate: '2026-07-24',
  startDate: null,
  duration: 20,
  discount: 0,
  renewalType: 'renewal' as const,
  paid: false,
};

beforeEach(() => jest.clearAllMocks());

describe('useAppointment', () => {
  it('fetches the appointment by id', async () => {
    mockGet.mockResolvedValueOnce(appointment);
    const { result } = renderHook(() => useAppointment('appt-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.appointment).toEqual(appointment));

    expect(mockGet).toHaveBeenCalledWith('/appointments/appt-1');
  });

  it('is loading before the fetch resolves', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAppointment('appt-1'), { wrapper: makeWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.appointment).toBeNull();
  });

  it('surfaces isError when the appointment fetch fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('not found'));
    const { result } = renderHook(() => useAppointment('appt-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('resolves the renewal in a single atomic call', async () => {
    mockGet.mockResolvedValueOnce(appointment);
    mockPost.mockResolvedValueOnce({ id: 'sub-3' });
    const { result } = renderHook(() => useAppointment('appt-1'), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.resolveRenewal(renewalPayload);
    });

    expect(mockPost).toHaveBeenCalledWith('/appointments/appt-1/resolve-renewal', renewalPayload);
  });
});
