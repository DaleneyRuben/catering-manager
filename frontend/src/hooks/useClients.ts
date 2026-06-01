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
  duration: number;
  discount: number;
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

export interface ClientFilters {
  status?: string;
  q?: string;
  birthMonth?: string;
}

export interface ClientCounts {
  active: number;
  expiring: number;
  paused: number;
  ended: number;
  total: number;
}

export function useClients(filters: ClientFilters = {}) {
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.q) params.set('q', filters.q);
      if (filters.birthMonth && filters.birthMonth !== 'all')
        params.set('birthMonth', filters.birthMonth);
      const qs = params.toString();
      return api.get<Client[]>(`/clients${qs ? `?${qs}` : ''}`);
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    clients,
    isLoading,
    isCreating: createMutation.isPending,
    create: (client: ClientCreateDraft, subscription: SubscriptionCreateDraft): Promise<void> =>
      createMutation.mutateAsync({ client, subscription }).then(() => {}),
  };
}

export function useClientCounts() {
  const { data, isLoading } = useQuery({
    queryKey: ['clients', 'counts'],
    queryFn: () => api.get<ClientCounts>('/clients/counts'),
  });
  return { counts: data, isLoading };
}
