import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/services/api';
import type { Appointment } from '@/features/evaluations/types';

export interface EvaluationHistoryFilters {
  status?: 'pagado' | 'no_pagado' | 'all';
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function useEvaluationHistory(filters: EvaluationHistoryFilters = {}) {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['appointments', 'nutritionist', 'history', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.q) params.set('q', filters.q);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      return api.getPaginated<Appointment>(
        `/appointments/nutritionist/history${qs ? `?${qs}` : ''}`,
      );
    },
    placeholderData: keepPreviousData,
  });

  return {
    appointments: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    isFetching,
  };
}
