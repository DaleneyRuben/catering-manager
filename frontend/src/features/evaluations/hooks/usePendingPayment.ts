import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toVoid } from '@/utils/toVoid';
import api from '@/services/api';
import type { Client } from '@/features/clients/types';

export function usePendingPayment() {
  const qc = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['evaluations', 'pending-payment'],
    queryFn: () => api.get<Client[]>('/evaluations/pending-payment'),
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
    mutationFn: (id: string) => api.delete(`/evaluations/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Cliente eliminado');
    },
  });

  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    markPaid: (id: string): Promise<void> => toVoid(markPaidMutation.mutateAsync(id)),
    remove: (id: string): Promise<void> => toVoid(removeMutation.mutateAsync(id)),
  };
}
