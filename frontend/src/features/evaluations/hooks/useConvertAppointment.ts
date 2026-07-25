import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toVoid } from '@/utils/toVoid';
import api from '@/services/api';
import type {
  ClientCreateDraft,
  SubscriptionCreateDraft,
} from '@/features/clients/hooks/useClientList';

type ConvertSubscriptionDraft = SubscriptionCreateDraft & { paid: boolean };

export function useConvertAppointment() {
  const qc = useQueryClient();

  const convertMutation = useMutation({
    mutationFn: ({
      appointmentId,
      client,
      subscription,
    }: {
      appointmentId: string;
      client: ClientCreateDraft;
      subscription: ConvertSubscriptionDraft;
    }) => api.post(`/appointments/${appointmentId}/convert`, { client, subscription }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    isConverting: convertMutation.isPending,
    convert: (
      appointmentId: string,
      client: ClientCreateDraft,
      subscription: ConvertSubscriptionDraft,
    ): Promise<void> =>
      toVoid(convertMutation.mutateAsync({ appointmentId, client, subscription })),
  };
}
