import { ConfirmModal } from "../ui/ConfirmModal";

export function ConfirmFinalizeModal({
  clientName,
  onClose,
  onConfirm,
}: {
  clientName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ConfirmModal
      title="Finalizar plan"
      message={
        <>
          ¿Seguro que querés finalizar el plan de{' '}
          <span className="font-semibold">{clientName}</span>? Esto establece la fecha de fin al día
          de hoy y desactiva al cliente. Esta acción no se puede deshacer.
        </>
      }
      confirmLabel="Finalizar"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
