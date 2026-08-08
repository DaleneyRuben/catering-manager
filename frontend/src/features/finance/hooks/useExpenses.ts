import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { ExpenseInput } from '@/features/finance/types';

type UpdatePayload = { id: string; changes: Partial<ExpenseInput> };

export function useExpenseMutations() {
  const queryClient = useQueryClient();

  // Every write moves the month's totals, so the register is refetched rather than left showing
  // figures that predate the change.
  const onSettled = () => queryClient.invalidateQueries({ queryKey: ['finance'] });

  const createMutation = useMutation({
    mutationFn: (input: ExpenseInput) => api.post('/finance/expenses', input),
    onSuccess: onSettled,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }: UpdatePayload) => api.patch(`/finance/expenses/${id}`, changes),
    onSuccess: onSettled,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/expenses/${id}`),
    onSuccess: onSettled,
  });

  return {
    create: (input: ExpenseInput) => createMutation.mutateAsync(input),
    update: (id: string, changes: Partial<ExpenseInput>) =>
      updateMutation.mutateAsync({ id, changes }),
    remove: (id: string) => removeMutation.mutateAsync(id),
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}
