import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { ProductionData } from '@/features/production/types';

export function useProduction() {
  const query = useQuery({
    queryKey: ['production'],
    queryFn: (): Promise<ProductionData> => api.get<ProductionData>('/production'),
  });

  return {
    summary: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
