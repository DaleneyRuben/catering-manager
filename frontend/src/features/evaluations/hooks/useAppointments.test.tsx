import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useAppointments } from '@/features/evaluations/hooks/useAppointments';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockDelete = api.delete as jest.Mock;

const appointment1 = {
  id: '1',
  name: 'Ana Pérez',
  phone: '71234567',
  date: '2026-08-03',
  time: '09:00',
  subscriptionId: null,
  clientId: null,
};

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
  mockGet.mockImplementation((url: string) => {
    if (url === '/appointments/pending') return Promise.resolve([appointment1]);
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
});

describe('useAppointments', () => {
  it('returns pending appointments after loading', async () => {
    const { result } = renderHook(() => useAppointments(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.appointments).toEqual([appointment1]);
  });

  it('isLoading is true initially', () => {
    const { result } = renderHook(() => useAppointments(), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('create calls POST /appointments', async () => {
    mockPost.mockResolvedValue(appointment1);
    const { result } = renderHook(() => useAppointments(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.create({
      name: 'Ana Pérez',
      phone: '71234567',
      date: '2026-08-03',
      time: '09:00',
    });

    expect(mockPost).toHaveBeenCalledWith('/appointments', {
      name: 'Ana Pérez',
      phone: '71234567',
      date: '2026-08-03',
      time: '09:00',
    });
  });

  it('update calls PATCH /appointments/:id', async () => {
    mockPatch.mockResolvedValue({ ...appointment1, name: 'Nuevo nombre' });
    const { result } = renderHook(() => useAppointments(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.update('1', {
      name: 'Nuevo nombre',
      phone: '71234567',
      date: '2026-08-03',
      time: '09:00',
    });

    expect(mockPatch).toHaveBeenCalledWith('/appointments/1', {
      name: 'Nuevo nombre',
      phone: '71234567',
      date: '2026-08-03',
      time: '09:00',
    });
  });

  it('cancel calls DELETE /appointments/:id', async () => {
    mockDelete.mockResolvedValue({});
    const { result } = renderHook(() => useAppointments(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.cancel('1');

    expect(mockDelete).toHaveBeenCalledWith('/appointments/1');
  });

  it('isSaving is true while POST is in flight', async () => {
    mockPost.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAppointments(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSaving).toBe(false);
    result.current.create({ name: 'Ana', phone: '1', date: '2026-08-03', time: '09:00' });

    await waitFor(() => expect(result.current.isSaving).toBe(true));
  });
});
