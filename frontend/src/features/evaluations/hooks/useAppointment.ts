import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Appointment } from '@/features/evaluations/types';
import type { RenewalPayload, Subscription } from '@/features/clients/types';

export function useAppointment(id: string) {
  const qc = useQueryClient();

  const appointmentQuery = useQuery({
    queryKey: ['appointments', id],
    queryFn: () => api.get<Appointment>(`/appointments/${id}`),
  });

  const resolveRenewalMutation = useMutation({
    mutationFn: (data: RenewalPayload): Promise<Subscription> =>
      api.post<Subscription>(`/appointments/${id}/resolve-renewal`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    appointment: appointmentQuery.data ?? null,
    isLoading: appointmentQuery.isLoading,
    isError: appointmentQuery.isError,
    resolveRenewal: (data: RenewalPayload): Promise<Subscription> =>
      resolveRenewalMutation.mutateAsync(data),
    isResolvingRenewal: resolveRenewalMutation.isPending,
  };
}
