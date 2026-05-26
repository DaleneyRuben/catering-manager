import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Client } from '../types/client';

export function useClients() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: (): Promise<Client[]> => api.get('/clients').then((r) => r.data.data),
  });

  return { clients, isLoading };
}
