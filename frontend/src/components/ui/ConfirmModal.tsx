import { useState } from 'react';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { Button } from './Button';

interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmModal({ title, message, confirmLabel, onClose, onConfirm }: Props) {
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
    <Modal onClose={onClose} className="rounded-[10px] w-[min(420px,92vw)]">
      <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
        <Icon name="alert" size={16} className="text-warn" />
        <p className="font-serif text-[20px] leading-tight text-ink">{title}</p>
      </div>
      <div className="px-[22px] py-5">
        <p className="text-[13px] text-ink">{message}</p>
        <div className="flex gap-2.5 mt-5">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button variant="destructive" onClick={handleConfirm} loading={isLoading} leftIcon="x">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
