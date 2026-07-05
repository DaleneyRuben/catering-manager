import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { HealthReport } from '@/features/health/types';

export function useHealth() {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: (): Promise<HealthReport> => api.get<HealthReport>('/health'),
  });

  return {
    report: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refresh: () => query.refetch(),
  };
}
