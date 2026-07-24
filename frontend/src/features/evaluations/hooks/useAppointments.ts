import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toVoid } from '@/utils/toVoid';
import api from '@/services/api';
import type { Appointment, AppointmentDraft } from '@/features/evaluations/types';

export function useAppointments() {
  const qc = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'pending'],
    queryFn: () => api.get<Appointment[]>('/appointments/pending'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['appointments'] });

  const createMutation = useMutation({
    mutationFn: (draft: AppointmentDraft) => api.post('/appointments', draft),
    onSuccess: () => {
      invalidate();
      toast.success('Cita creada correctamente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: AppointmentDraft }) =>
      api.patch(`/appointments/${id}`, draft),
    onSuccess: () => {
      invalidate();
      toast.success('Cita actualizada');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/appointments/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Cita cancelada');
    },
  });

  return {
    appointments: appointmentsQuery.data ?? [],
    isLoading: appointmentsQuery.isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    create: (draft: AppointmentDraft): Promise<void> => toVoid(createMutation.mutateAsync(draft)),
    update: (id: string, draft: AppointmentDraft): Promise<void> =>
      toVoid(updateMutation.mutateAsync({ id, draft })),
    cancel: (id: string): Promise<void> => toVoid(cancelMutation.mutateAsync(id)),
  };
}
