import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { ClientHistoryEntry } from '../types/client';

export function useClientHistory(id: string | number) {
  const { data, isLoading } = useQuery({
    queryKey: ['clients', id, 'history'],
    queryFn: (): Promise<ClientHistoryEntry[]> => api.get(`/clients/${id}/history`),
  });

  return { history: data ?? [], isLoading };
}
