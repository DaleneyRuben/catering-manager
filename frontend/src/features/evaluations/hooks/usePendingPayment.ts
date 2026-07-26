import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toVoid } from '@/utils/toVoid';
import api from '@/services/api';
import type { PendingPaymentClient } from '@/features/evaluations/types';

export function usePendingPayment() {
  const qc = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['evaluations', 'pending-payment'],
    queryFn: () => api.get<PendingPaymentClient[]>('/evaluations/pending-payment'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['evaluations', 'pending-payment'] });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.post(`/evaluations/${id}/mark-paid`),
    onSuccess: () => {
      invalidate();
      toast.success('Pago confirmado');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (client: PendingPaymentClient) =>
      client.isExistingClientRenewal
        ? api.delete(`/evaluations/${client.id}/pending-renewal`)
        : api.delete(`/evaluations/${client.id}`),
    onSuccess: (_data, client) => {
      invalidate();
      toast.success(client.isExistingClientRenewal ? 'Renovación descartada' : 'Cliente eliminado');
    },
  });

  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    markPaid: (id: string): Promise<void> => toVoid(markPaidMutation.mutateAsync(id)),
    remove: (client: PendingPaymentClient): Promise<void> =>
      toVoid(removeMutation.mutateAsync(client)),
  };
}
