import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';

export function ConfirmDeleteModal({
  planName,
  onClose,
  onConfirm,
}: {
  planName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(20,40,6,0.32)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-cream border border-rule-2 rounded-[10px] w-[min(420px,92vw)] shadow-[0_20px_60px_rgba(20,40,6,0.25)]"
      >
        <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
          <Icon name="alert" size={16} className="text-warn" />
          <p className="font-serif text-[20px] leading-tight text-ink">Eliminar plan</p>
        </div>

        <div className="px-[22px] py-5">
          <p className="text-[13px] text-ink">
            ¿Seguro que quieres eliminar <span className="font-semibold">{planName}</span>? Esta
            acción no se puede deshacer.
          </p>
          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-paper transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-warn text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name="x" size={14} />
              )}
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
