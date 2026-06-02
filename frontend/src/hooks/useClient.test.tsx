import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { useClient } from './useClient';

jest.mock('../services/api', () => ({
  default: { get: jest.fn(), patch: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;

const client1 = {
  id: 1,
  name: 'María García',
  sex: 'female',
  dateOfBirth: '1980-03-10',
  phoneNumber: '555-0001',
  address: 'Calle 10',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: [],
  restrictions: [],
  isActive: true,
  subscriptions: [],
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
});

describe('useClient', () => {
  it('isLoading is true initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClient('1'), { wrapper: makeWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns client after loading', async () => {
    mockGet.mockResolvedValue(client1);
    const { result } = renderHook(() => useClient('1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.client).toEqual(client1);
  });

  it('returns null before data arrives', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClient('1'), { wrapper: makeWrapper() });
    expect(result.current.client).toBeNull();
  });

  it('update calls PATCH /clients/:id', async () => {
    const updated = { ...client1, name: 'Ana García' };
    mockGet.mockResolvedValue(client1);
    mockPatch.mockResolvedValue(updated);
    const { result } = renderHook(() => useClient('1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.update({ name: 'Ana García' });

    expect(mockPatch).toHaveBeenCalledWith('/clients/1', { name: 'Ana García' });
  });

  it('update returns the updated client', async () => {
    const updated = { ...client1, isActive: false };
    mockGet.mockResolvedValue(client1);
    mockPatch.mockResolvedValue(updated);
    const { result } = renderHook(() => useClient('1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const returned = await result.current.update({ isActive: false });

    expect(returned).toEqual(updated);
  });
});
