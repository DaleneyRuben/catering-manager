import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { FinanceOverview } from '@/features/finance/types';

export function useFinance(month: string) {
  const query = useQuery({
    queryKey: ['finance', month],
    queryFn: (): Promise<FinanceOverview> => api.get<FinanceOverview>(`/finance?month=${month}`),
  });

  return {
    overview: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
