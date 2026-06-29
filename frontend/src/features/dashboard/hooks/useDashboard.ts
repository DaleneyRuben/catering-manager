import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { DashboardSummary } from '@/features/dashboard/types';

export function useDashboard() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: (): Promise<DashboardSummary> => api.get<DashboardSummary>('/dashboard'),
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
  };
}
