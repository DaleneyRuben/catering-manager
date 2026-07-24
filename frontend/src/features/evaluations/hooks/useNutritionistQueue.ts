import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { Appointment } from '@/features/evaluations/types';

export function useNutritionistQueue() {
  const queueQuery = useQuery({
    queryKey: ['appointments', 'nutritionist'],
    queryFn: () => api.get<Appointment[]>('/appointments/nutritionist'),
  });

  return {
    appointments: queueQuery.data ?? [],
    isLoading: queueQuery.isLoading,
  };
}
