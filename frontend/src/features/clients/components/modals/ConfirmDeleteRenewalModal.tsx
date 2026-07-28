import { ConfirmModal } from '@ui/ConfirmModal';
import { formatDate } from '@/utils/format';
import type { Subscription } from '@/features/clients/types';

interface Props {
  clientName: string;
  renewal: Subscription;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteRenewalModal({ clientName, renewal, onClose, onConfirm }: Props) {
  const contract =
    renewal.startDate && renewal.contractEndDate
      ? `${formatDate(renewal.startDate)} → ${formatDate(renewal.contractEndDate)}`
      : 'sin fecha de inicio';

  return (
    <ConfirmModal
      title="Eliminar renovación"
      message={
        <>
          ¿Seguro que quieres eliminar la renovación de{' '}
          <span className="font-semibold">{clientName}</span>? Se elimina el contrato{' '}
          <span className="font-mono">{contract}</span> del plan {renewal.plan.name}. El plan
          vigente no cambia y queda registrada en el historial.
        </>
      }
      confirmLabel="Eliminar renovación"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
