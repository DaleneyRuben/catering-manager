import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toVoid } from '../utils/toVoid';
import api from '../services/api';
import type { UserRole } from '../contexts/AuthContext';

export type AppUser = {
  id: string;
  username: string;
  role: UserRole;
  lastLoginAt: string | null;
};

export type UserDraft = {
  username: string;
  password: string;
  role: UserRole;
};

export type UserUpdateDraft = {
  username?: string;
  password?: string;
  role?: UserRole;
};

export function useUsers() {
  const qc = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: (): Promise<AppUser[]> => api.get<AppUser[]>('/users'),
  });

  const createMutation = useMutation({
    mutationFn: (draft: UserDraft) => api.post('/users', draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: UserUpdateDraft }) =>
      api.patch(`/users/${id}`, draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado');
    },
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    create: (draft: UserDraft): Promise<void> => toVoid(createMutation.mutateAsync(draft)),
    update: (id: string, draft: UserUpdateDraft): Promise<void> =>
      toVoid(updateMutation.mutateAsync({ id, draft })),
    remove: (id: string): Promise<void> => toVoid(removeMutation.mutateAsync(id)),
  };
}
