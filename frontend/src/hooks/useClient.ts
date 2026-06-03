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
    isUpdatingSuspensions: updateSuspensionsMutation.isPending,
    update: (data: ClientUpdateDraft): Promise<Client> => updateMutation.mutateAsync(data),
    finalize: (): Promise<void> => finalizeMutation.mutateAsync().then(() => {}),
    updateSuspensions: (subscriptionId: number, suspendedDates: string[]): Promise<void> =>
      updateSuspensionsMutation.mutateAsync({ suspendedDates, subscriptionId }).then(() => {}),
  };
}
