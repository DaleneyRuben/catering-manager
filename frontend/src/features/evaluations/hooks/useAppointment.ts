import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toVoid } from '@/utils/toVoid';
import api from '@/services/api';
import type { Appointment } from '@/features/evaluations/types';

export function useAppointment(id: string) {
  const qc = useQueryClient();

  const appointmentQuery = useQuery({
    queryKey: ['appointments', id],
    queryFn: () => api.get<Appointment>(`/appointments/${id}`),
  });

  const linkSubscriptionMutation = useMutation({
    mutationFn: (subscriptionId: string) => api.patch(`/appointments/${id}`, { subscriptionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    appointment: appointmentQuery.data ?? null,
    isLoading: appointmentQuery.isLoading,
    linkSubscription: (subscriptionId: string): Promise<void> =>
      toVoid(linkSubscriptionMutation.mutateAsync(subscriptionId)),
    isLinkingSubscription: linkSubscriptionMutation.isPending,
  };
}
