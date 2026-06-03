import { ConfirmModal } from '../../components/ui/ConfirmModal';

export function ConfirmDeleteModal({
  planName,
  onClose,
  onConfirm,
}: {
  planName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ConfirmModal
      title="Eliminar plan"
      message={
        <>
          ¿Seguro que quieres eliminar <span className="font-semibold">{planName}</span>? Esta
          acción no se puede deshacer.
        </>
      }
      confirmLabel="Eliminar"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
