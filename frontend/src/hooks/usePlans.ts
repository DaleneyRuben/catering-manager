import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Plan } from '../types/client';
import type { PlanDraft } from '../pages/plans/types';

export function usePlans() {
  const qc = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: (): Promise<Plan[]> => api.get<Plan[]>('/plans'),
  });

  const clientCountsQuery = useQuery({
    queryKey: ['plans', 'client-counts'],
    queryFn: (): Promise<Record<string, number>> => api.get('/plans/client-counts'),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: PlanDraft }) =>
      api.patch(`/plans/${id}`, {
        name: draft.name,
        meals: draft.meals,
        price: Number(draft.price),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });

  const createMutation = useMutation({
    mutationFn: (draft: PlanDraft) =>
      api.post('/plans', {
        name: draft.name,
        meals: draft.meals,
        price: Number(draft.price),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });

  return {
    plans: plansQuery.data ?? [],
    clientCounts: clientCountsQuery.data ?? {},
    isLoading: plansQuery.isLoading,
    isSaving: saveMutation.isPending,
    save: (id: string, draft: PlanDraft): Promise<void> =>
      saveMutation.mutateAsync({ id, draft }).then(() => {}),
    create: (draft: PlanDraft): Promise<void> => createMutation.mutateAsync(draft).then(() => {}),
    remove: (id: string): Promise<void> => removeMutation.mutateAsync(id).then(() => {}),
  };
}
