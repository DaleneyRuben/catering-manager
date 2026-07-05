import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { UserRole } from '@/features/auth/AuthContext';

export type SessionEntry = {
  username: string;
  role: UserRole;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  createdAt: string;
};

export function useSessionHistory() {
  const query = useQuery({
    queryKey: ['dashboard', 'sessions'],
    queryFn: (): Promise<SessionEntry[]> => api.get<SessionEntry[]>('/dashboard/sessions'),
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
