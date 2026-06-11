import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

  const planBody = (draft: PlanDraft) => ({
    name: draft.name,
    meals: draft.meals,
    price: Number(draft.price),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: PlanDraft }) =>
      api.patch(`/plans/${id}`, planBody(draft)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan actualizado');
    },
  });

  const createMutation = useMutation({
    mutationFn: (draft: PlanDraft) => api.post('/plans', planBody(draft)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan creado correctamente');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan eliminado');
    },
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
