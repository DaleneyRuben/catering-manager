import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Client } from '../types/client';
import type { ClientUpdateDraft } from './useClients';

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
    },
  });

  return {
    client: client ?? null,
    isLoading,
    isUpdating: updateMutation.isPending,
    update: (data: ClientUpdateDraft): Promise<Client> => updateMutation.mutateAsync(data),
  };
}
