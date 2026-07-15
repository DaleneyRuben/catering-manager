import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { WeeklyCounts } from '@/features/production/types';

// Offset 0 is already served by the main /production payload, so it is never fetched here.
export function useWeeklyCounts(offset: number) {
  const query = useQuery({
    queryKey: ['production', 'weekly-counts', offset],
    queryFn: (): Promise<WeeklyCounts> =>
      api.get<WeeklyCounts>(`/production/weekly-counts?offset=${offset}`),
    enabled: offset > 0,
  });

  return {
    weeklyCounts: query.data ?? null,
    isLoading: query.isLoading && offset > 0,
    error: query.error,
  };
}
