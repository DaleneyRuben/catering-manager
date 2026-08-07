import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { FinanceOverview, MovementFilters } from '@/features/finance/types';

const NO_FILTERS: MovementFilters = { q: '', direction: 'all', categoryId: '' };

// Only what actually narrows something reaches the query: "todos" and an untouched search field
// are the absence of a filter, not values the API has an answer for.
const toQuery = (month: string, filters: MovementFilters): string => {
  const params = new URLSearchParams({ month });
  if (filters.direction !== 'all') params.set('direction', filters.direction);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.q.trim()) params.set('q', filters.q.trim());
  // URLSearchParams encodes a space as '+', which the register's search would then look for
  // literally; every other escape it produces is the same one encodeURIComponent gives.
  return params.toString().replace(/\+/g, '%20');
};

export function useFinance(month: string, filters: MovementFilters = NO_FILTERS) {
  const query = useQuery({
    queryKey: ['finance', month, filters.direction, filters.categoryId, filters.q.trim()],
    queryFn: (): Promise<FinanceOverview> =>
      api.get<FinanceOverview>(`/finance?${toQuery(month, filters)}`),
  });

  return {
    overview: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
