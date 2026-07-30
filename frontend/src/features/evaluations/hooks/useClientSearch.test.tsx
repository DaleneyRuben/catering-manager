import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { useClientSearch } from '@/features/evaluations/hooks/useClientSearch';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn() },
}));
const mockGet = api.get as jest.Mock;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useClientSearch', () => {
  it('does not query when the search text is empty', () => {
    const { result } = renderHook(() => useClientSearch(''), { wrapper: makeWrapper() });
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it('does not query when the search text is only whitespace', () => {
    renderHook(() => useClientSearch('   '), { wrapper: makeWrapper() });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('queries the search endpoint with the trimmed, encoded term', async () => {
    mockGet.mockResolvedValue([{ id: '1', name: 'Fernando Daleney', phoneNumber: '76637732' }]);
    const { result } = renderHook(() => useClientSearch(' fernando '), { wrapper: makeWrapper() });

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/clients/search?q=fernando'));
    await waitFor(() =>
      expect(result.current.results).toEqual([
        { id: '1', name: 'Fernando Daleney', phoneNumber: '76637732' },
      ]),
    );
  });
});
