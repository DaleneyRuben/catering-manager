import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { DayClients } from '@/features/production/types';

export function useProductionDay(date: string | null) {
  const query = useQuery({
    queryKey: ['production', 'day', date],
    queryFn: (): Promise<DayClients> => api.get<DayClients>(`/production/day-clients?date=${date}`),
    enabled: date !== null,
  });

  return {
    dayClients: query.data ?? null,
    isLoading: query.isLoading && date !== null,
    error: query.error,
  };
}
