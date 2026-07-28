import type { Subscription } from '@/features/clients/types';

interface Props {
  clientName: string;
  renewal: Subscription;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteRenewalModal(_props: Props) {
  return null;
}
