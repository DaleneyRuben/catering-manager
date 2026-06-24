import { useState } from 'react';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { Button } from './Button';
import { MODAL_CANCEL_STYLE, CONFIRM_DIALOG_STYLE } from './modalButtonStyles';

interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  icon?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmModal({ title, message, confirmLabel, icon, onClose, onConfirm }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} className="w-[min(420px,92vw)]">
      <div className="px-[28px] py-[26px]">
        {icon ? (
          <div className="flex items-center gap-3 mb-3.5">
            <span
              data-testid="confirm-modal-icon-badge"
              className="w-10 h-10 rounded-[11px] bg-danger-bg text-danger flex items-center justify-center shrink-0"
            >
              <Icon name={icon} size={20} stroke={1.9} />
            </span>
            <p className="font-serif font-semibold text-[24px] leading-[1.05] text-ink">{title}</p>
          </div>
        ) : (
          <p className="font-serif font-semibold text-[24px] leading-[1.05] text-ink mb-[10px]">
            {title}
          </p>
        )}
        <p className="text-[13.5px] text-ink-2 leading-[1.55]">{message}</p>
        <div className="flex justify-end gap-2.5 mt-[22px]">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            style={MODAL_CANCEL_STYLE}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            loading={isLoading}
            style={CONFIRM_DIALOG_STYLE}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
