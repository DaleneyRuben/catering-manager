import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Client } from '../types/client';
import type { ClientUpdateDraft } from './useClientList';

export function useClient(id: string | number) {
  const qc = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: (): Promise<Client> => api.get<Client>(`/clients/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ClientUpdateDraft): Promise<Client> =>
      api.patch<Client>(`/clients/${id}`, data),
    onSuccess: (updated) => {
      qc.setQueryData(['clients', id], updated);
      qc.invalidateQueries({ queryKey: ['clients'], exact: true });
      qc.invalidateQueries({ queryKey: ['clients', id, 'history'] });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => api.post(`/clients/${id}/finalize`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id] });
      qc.invalidateQueries({ queryKey: ['clients'], exact: true });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: ({
      subscriptionId,
      contractDate,
      startDate,
      duration,
    }: {
      subscriptionId: number;
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
      qc.invalidateQueries({ queryKey: ['clients', id] });
      qc.invalidateQueries({ queryKey: ['clients', id, 'history'] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: (data: {
      planId: number;
      contractDate: string;
      startDate?: string | null;
      duration: number;
      discount: number;
      renewalType: 'renewal' | 'reactivation';
    }) => api.post(`/clients/${id}/subscriptions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id] });
      qc.invalidateQueries({ queryKey: ['clients'], exact: true });
      qc.invalidateQueries({ queryKey: ['clients', id, 'history'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateSuspensionsMutation = useMutation({
    mutationFn: ({
      suspendedDates,
      subscriptionId,
    }: {
      suspendedDates: string[];
      subscriptionId: number;
    }) => api.patch(`/clients/${id}/subscriptions/${subscriptionId}`, { suspendedDates }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id] });
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
      subscriptionId: number,
      draft: { contractDate: string; startDate: string; duration: number },
    ): Promise<void> =>
      updateContractMutation.mutateAsync({ subscriptionId, ...draft }).then(() => {}),
    updateSuspensions: (subscriptionId: number, suspendedDates: string[]): Promise<void> =>
      updateSuspensionsMutation.mutateAsync({ suspendedDates, subscriptionId }).then(() => {}),
    renew: (data: {
      planId: number;
      contractDate: string;
      startDate?: string | null;
      duration: number;
      discount: number;
      renewalType: 'renewal' | 'reactivation';
    }): Promise<void> => renewMutation.mutateAsync(data).then(() => {}),
    isRenewing: renewMutation.isPending,
  };
}
