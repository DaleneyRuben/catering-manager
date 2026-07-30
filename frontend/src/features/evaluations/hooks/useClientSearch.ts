import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { ClientSearchResult } from '@/features/evaluations/types';

export function useClientSearch(query: string) {
  const trimmed = query.trim();

  const { data, isFetching } = useQuery({
    queryKey: ['clients', 'search', trimmed],
    queryFn: () =>
      api.get<ClientSearchResult[]>(`/clients/search?q=${encodeURIComponent(trimmed)}`),
    enabled: trimmed.length > 0,
  });

  return { results: data ?? [], isSearching: isFetching };
}
