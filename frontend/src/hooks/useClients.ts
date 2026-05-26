import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Client } from '../types/client';

export interface ClientCreateDraft {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  zone: string;
  delivery: string;
  nit?: string;
  businessName?: string;
  underlyingDiseases: string[];
  restrictions: string[];
}

export interface SubscriptionCreateDraft {
  planId: number;
  startDate: string;
  contractDate: string;
  contractEndDate: string;
}

export interface ClientUpdateDraft {
  name?: string;
  sex?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  zone?: string;
  delivery?: string;
  nit?: string | null;
  businessName?: string | null;
  underlyingDiseases?: string[];
  restrictions?: string[];
  isActive?: boolean;
}

export function useClients() {
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: (): Promise<Client[]> => api.get<Client[]>('/clients'),
  });

  const createMutation = useMutation({
    mutationFn: async ({
      client,
      subscription,
    }: {
      client: ClientCreateDraft;
      subscription: SubscriptionCreateDraft;
    }) => {
      const created = await api.post<{ id: number }>('/clients', client);
      await api.post(`/clients/${created.id}/subscriptions`, subscription);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  return {
    clients,
    isLoading,
    isCreating: createMutation.isPending,
    create: (client: ClientCreateDraft, subscription: SubscriptionCreateDraft): Promise<void> =>
      createMutation.mutateAsync({ client, subscription }).then(() => {}),
  };
}
