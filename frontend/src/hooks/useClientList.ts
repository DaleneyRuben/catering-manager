import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';
import type { Client } from '../types/client';
import { CLIENT_STATUS } from '../constants/clientStatus';

export interface ClientCreateDraft {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  deliveryZone: string;
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
  deliveryZone?: string;
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
  page?: number;
  limit?: number;
}

export interface ClientCounts {
  active: number;
  expiring: number;
  paused: number;
  ended: number;
  total: number;
}

export function useClientList(filters: ClientFilters = {}) {
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['clients', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== CLIENT_STATUS.ALL)
        params.set('status', filters.status);
      if (filters.q) params.set('q', filters.q);
      if (filters.birthMonth && filters.birthMonth !== CLIENT_STATUS.ALL)
        params.set('birthMonth', filters.birthMonth);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      return api.getPaginated<Client>(`/clients${qs ? `?${qs}` : ''}`);
    },
    placeholderData: keepPreviousData,
  });

  const clients = data?.data ?? [];
  const total = data?.total ?? 0;

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
    total,
    isLoading,
    isFetching,
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
