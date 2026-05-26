import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Client, Plan } from '../types/client';
import type { PlanDraft } from '../pages/plans/types';

export function usePlans() {
  const qc = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: (): Promise<Plan[]> => api.get('/plans').then((r) => r.data.data),
  });

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: (): Promise<Client[]> => api.get('/clients').then((r) => r.data.data),
  });

  const clientCounts = useMemo(() => {
    const clients = clientsQuery.data ?? [];
    return clients.reduce<Record<number, number>>((acc, c) => {
      const sub = c.subscriptions?.[0];
      if (!sub) return acc;
      return { ...acc, [sub.planId]: (acc[sub.planId] ?? 0) + 1 };
    }, {});
  }, [clientsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: PlanDraft }) =>
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
    mutationFn: (id: number) => api.delete(`/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });

  return {
    plans: plansQuery.data ?? [],
    clientCounts,
    isLoading: plansQuery.isLoading || clientsQuery.isLoading,
    isSaving: saveMutation.isPending,
    save: (id: number, draft: PlanDraft) => saveMutation.mutateAsync({ id, draft }),
    create: (draft: PlanDraft) => createMutation.mutateAsync(draft),
    remove: (id: number) => removeMutation.mutateAsync(id),
  };
}
