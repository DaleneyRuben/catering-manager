import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { WeeklyCounts } from '@/features/production/types';

interface Options {
  enabled: boolean;
  initialData?: WeeklyCounts;
}

// Keyed by absolute week Monday so cached entries stay correct across the
// Sunday display-week rollover. The current week is seeded via initialData
// from the main /production payload and never fetched separately.
export function useWeeklyCounts(weekStart: string, { enabled, initialData }: Options) {
  const query = useQuery({
    queryKey: ['production', 'weekly-counts', weekStart],
    queryFn: (): Promise<WeeklyCounts> =>
      api.get<WeeklyCounts>(`/production/weekly-counts?weekStart=${weekStart}`),
    enabled,
    initialData,
    staleTime: 30_000,
  });

  return {
    weeklyCounts: query.data ?? null,
    isLoading: query.isLoading && enabled,
    error: query.error,
  };
}
