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

export function useSessionHistory(roles?: UserRole[]) {
  const url = roles ? `/dashboard/sessions?roles=${roles.join(',')}` : '/dashboard/sessions';

  const query = useQuery({
    queryKey: ['dashboard', 'sessions', roles ?? null],
    queryFn: (): Promise<SessionEntry[]> => api.get<SessionEntry[]>(url),
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
