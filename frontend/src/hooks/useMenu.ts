import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Menu, MenuDraft } from '../types/menu';

export function useMenu() {
  const qc = useQueryClient();

  const menusQuery = useQuery({
    queryKey: ['menus'],
    queryFn: (): Promise<Menu[]> => api.get<Menu[]>('/menus'),
  });

  const saveMutation = useMutation({
    mutationFn: (draft: MenuDraft) => api.put<Menu>('/menus', draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menus'] }),
  });

  return {
    menus: menusQuery.data ?? [],
    isLoading: menusQuery.isLoading,
    isSaving: saveMutation.isPending,
    save: (draft: MenuDraft): Promise<Menu> => saveMutation.mutateAsync(draft) as Promise<Menu>,
    error: saveMutation.error,
  };
}
