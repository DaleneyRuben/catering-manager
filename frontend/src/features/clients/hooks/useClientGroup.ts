import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import type { GroupMember } from '@/features/clients/types';

export function useClientGroup(clientId: string, initialMembers: GroupMember[]) {
  const qc = useQueryClient();
  const [members, setMembers] = useState<GroupMember[]>(initialMembers);
  const [savedMembers, setSavedMembers] = useState<GroupMember[]>(initialMembers);

  const isDirty =
    members.length !== savedMembers.length ||
    members.some((m) => !savedMembers.find((s) => s.id === m.id));

  const mutation = useMutation({
    mutationFn: (memberIds: string[]) => api.put(`/clients/${clientId}/group`, { memberIds }),
    onSuccess: () => {
      setSavedMembers(members);
      qc.invalidateQueries({ queryKey: ['clients', clientId] });
      toast.success('Grupo actualizado');
    },
  });

  const add = (member: GroupMember) => {
    setMembers((prev) => (prev.find((m) => m.id === member.id) ? prev : [...prev, member]));
  };

  const remove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const save = () => mutation.mutateAsync(members.map((m) => m.id));

  return { members, isDirty, add, remove, save, isSaving: mutation.isPending };
}
