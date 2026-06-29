import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/services/api';
import type { Client } from '@/features/clients/types';
import { CLIENT_STATUS } from '@/features/clients/constants/clientStatus';

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
  planId: string;
  startDate: string;
  contractDate: string;
  duration: number;
  discount: number;
  specialInstructions?: Record<string, string>;
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
  pausedSince?: string | null;
}

export interface ClientFilters {
  status?: string;
  q?: string;
  restriction?: string;
  page?: number;
  limit?: number;
}

export function useClientList(filters: ClientFilters = {}) {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['clients', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== CLIENT_STATUS.ALL)
        params.set('status', filters.status);
      if (filters.q) params.set('q', filters.q);
      if (filters.restriction) params.set('restriction', filters.restriction);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      return api.getPaginated<Client>(`/clients${qs ? `?${qs}` : ''}`);
    },
    placeholderData: keepPreviousData,
  });

  const clients = data?.data ?? [];
  const total = data?.total ?? 0;

  return {
    clients,
    total,
    isLoading,
    isFetching,
  };
}
