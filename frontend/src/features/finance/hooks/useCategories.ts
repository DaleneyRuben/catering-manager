import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { ExpenseCategory, ExpenseCategoryWithUsage } from '@/features/finance/types';

// The management modal's read: archived categories included, because they have to be visible
// somewhere to be restorable, and usage counted against the month on screen rather than today's.
export function useCategoryCatalog(month: string) {
  const query = useQuery({
    queryKey: ['expense-categories', 'catalog', month],
    queryFn: (): Promise<ExpenseCategoryWithUsage[]> =>
      api.get<ExpenseCategoryWithUsage[]>(
        `/finance/categories?includeArchived=true&month=${month}`,
      ),
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
  };
}

type RenamePayload = { id: string; name: string };
type ActivePayload = { id: string; active: boolean };

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  // A rename moves the label in every month's breakdown and an archive changes what the expense
  // form offers, so both the catalog and the register on screen are stale afterwards. The prefix
  // key covers the modal's catalog and the form's active-only list in one go.
  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    queryClient.invalidateQueries({ queryKey: ['finance'] });
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<ExpenseCategory>('/finance/categories', { name }),
    onSuccess,
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: RenamePayload) =>
      api.patch<ExpenseCategory>(`/finance/categories/${id}`, { name }),
    onSuccess,
  });

  // Archiving and restoring are one row's `active` flag, which is why there is no DELETE: an
  // expense already filed against a category keeps naming it forever.
  const activeMutation = useMutation({
    mutationFn: ({ id, active }: ActivePayload) =>
      api.patch<ExpenseCategory>(`/finance/categories/${id}`, { active }),
    onSuccess,
  });

  return {
    create: (name: string) => createMutation.mutateAsync(name),
    rename: (id: string, name: string) => renameMutation.mutateAsync({ id, name }),
    archive: (id: string) => activeMutation.mutateAsync({ id, active: false }),
    restore: (id: string) => activeMutation.mutateAsync({ id, active: true }),
    isSaving: createMutation.isPending || renameMutation.isPending || activeMutation.isPending,
  };
}
