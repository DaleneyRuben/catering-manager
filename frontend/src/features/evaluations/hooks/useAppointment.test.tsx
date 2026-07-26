import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useAppointment } from '@/features/evaluations/hooks/useAppointment';

jest.mock('@/services/api', () => ({ default: { get: jest.fn(), patch: jest.fn() } }));

const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;

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

  it('links a subscription to the appointment via PATCH', async () => {
    mockGet.mockResolvedValueOnce(appointment);
    mockPatch.mockResolvedValueOnce({ ...appointment, subscriptionId: 'sub-3' });
    const { result } = renderHook(() => useAppointment('appt-1'), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.linkSubscription('sub-3');
    });

    expect(mockPatch).toHaveBeenCalledWith('/appointments/appt-1', { subscriptionId: 'sub-3' });
  });
});
