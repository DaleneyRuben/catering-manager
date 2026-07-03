import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export type LoginEntry = {
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  createdAt: string;
};

export function useLoginHistory(userId: string) {
  const query = useQuery({
    queryKey: ['users', userId, 'logins'],
    queryFn: (): Promise<LoginEntry[]> => api.get<LoginEntry[]>(`/users/${userId}/logins`),
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
