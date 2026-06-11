import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import type { Client, RenewalPayload } from '../types/client';
import type { ClientUpdateDraft } from './useClientList';

export function useClient(id: string | number) {
  const qc = useQueryClient();

  const invalidateClient = () => {
    qc.invalidateQueries({ queryKey: ['clients', id] });
    qc.invalidateQueries({ queryKey: ['clients', id, 'history'] });
  };

  const invalidateClientList = () => {
    qc.invalidateQueries({ queryKey: ['clients'], exact: true });
  };

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: (): Promise<Client> => api.get<Client>(`/clients/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ClientUpdateDraft): Promise<Client> =>
      api.patch<Client>(`/clients/${id}`, data),
    onSuccess: (updated) => {
      qc.setQueryData(['clients', id], updated);
      invalidateClientList();
      qc.invalidateQueries({ queryKey: ['clients', id, 'history'] });
      toast.success('Datos del cliente actualizados');
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => api.post(`/clients/${id}/finalize`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id] });
      invalidateClientList();
      toast.success('Plan finalizado');
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: ({
      subscriptionId,
      contractDate,
      startDate,
      duration,
    }: {
      subscriptionId: string;
      contractDate: string;
      startDate: string;
      duration: number;
    }) =>
      api.patch(`/clients/${id}/subscriptions/${subscriptionId}`, {
        contractDate,
        startDate,
        duration,
      }),
    onSuccess: () => {
      invalidateClient();
      toast.success('Contrato actualizado');
    },
  });

  const renewMutation = useMutation({
    mutationFn: (data: RenewalPayload) => api.post(`/clients/${id}/subscriptions`, data),
    onSuccess: (_data, variables) => {
      invalidateClient();
      invalidateClientList();
      toast.success(
        variables.renewalType === 'reactivation'
          ? 'Cliente reactivado correctamente'
          : 'Plan renovado correctamente',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente eliminado');
    },
  });

  const updateSuspensionsMutation = useMutation({
    mutationFn: ({
      suspendedDates,
      subscriptionId,
    }: {
      suspendedDates: string[];
      subscriptionId: string;
    }) => api.patch(`/clients/${id}/subscriptions/${subscriptionId}`, { suspendedDates }),
    onSuccess: () => {
      invalidateClient();
      toast.success('Suspensiones actualizadas');
    },
  });

  return {
    client: client ?? null,
    isLoading,
    isUpdating: updateMutation.isPending,
    isFinalizing: finalizeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingSuspensions: updateSuspensionsMutation.isPending,
    update: (data: ClientUpdateDraft): Promise<Client> => updateMutation.mutateAsync(data),
    finalize: (): Promise<void> => finalizeMutation.mutateAsync().then(() => {}),
    deleteClient: (): Promise<void> => deleteMutation.mutateAsync().then(() => {}),
    updateContract: (
      subscriptionId: string,
      draft: { contractDate: string; startDate: string; duration: number },
    ): Promise<void> =>
      updateContractMutation.mutateAsync({ subscriptionId, ...draft }).then(() => {}),
    updateSuspensions: (subscriptionId: string, suspendedDates: string[]): Promise<void> =>
      updateSuspensionsMutation.mutateAsync({ suspendedDates, subscriptionId }).then(() => {}),
    renew: (data: RenewalPayload): Promise<void> => renewMutation.mutateAsync(data).then(() => {}),
    isRenewing: renewMutation.isPending,
  };
}
