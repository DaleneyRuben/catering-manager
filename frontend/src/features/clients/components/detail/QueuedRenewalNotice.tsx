import type { Subscription } from '@/features/clients/types';

interface Props {
  renewal: Subscription;
  isPaused: boolean;
  onDelete: () => void;
  onAssignStartDate: () => void;
}

export function QueuedRenewalNotice(_props: Props) {
  return null;
}
