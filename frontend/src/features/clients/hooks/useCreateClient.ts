import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toVoid } from '@/utils/toVoid';
import api from '@/services/api';
import type {
  ClientCreateDraft,
  SubscriptionCreateDraft,
} from '@/features/clients/hooks/useClientList';

export function useCreateClient() {
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({
      client,
      subscription,
    }: {
      client: ClientCreateDraft;
      subscription: SubscriptionCreateDraft;
    }) => {
      const created = await api.post<{ id: string }>('/clients', client);
      await api.post(`/clients/${created.id}/subscriptions`, subscription);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente registrado correctamente');
    },
  });

  return {
    isCreating: createMutation.isPending,
    create: (client: ClientCreateDraft, subscription: SubscriptionCreateDraft): Promise<void> =>
      toVoid(createMutation.mutateAsync({ client, subscription })),
  };
}
