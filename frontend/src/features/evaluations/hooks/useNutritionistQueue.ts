import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { Appointment } from '@/features/evaluations/types';

interface Options {
  enabled?: boolean;
}

export function useNutritionistQueue({ enabled = true }: Options = {}) {
  const queueQuery = useQuery({
    queryKey: ['appointments', 'nutritionist'],
    queryFn: () => api.get<Appointment[]>('/appointments/nutritionist/pending'),
    enabled,
  });

  return {
    appointments: queueQuery.data ?? [],
    isLoading: queueQuery.isLoading,
  };
}
