import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export type ServiceCheck = {
  name: string;
  status: 'ok' | 'down';
  latencyMs: number;
};

export type HealthReport = {
  status: 'ok' | 'degraded' | 'down';
  checkedAt: string;
  services: ServiceCheck[];
  process: {
    uptimeSeconds: number;
    memoryUsedMb: number;
  };
};

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
