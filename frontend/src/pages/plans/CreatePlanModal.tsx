import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { PlanEditorForm } from './PlanEditorForm';
import type { PlanDraft } from './types';

export function CreatePlanModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: PlanDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PlanDraft>({ name: '', meals: [], price: '0' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      className="rounded-[10px] w-[min(640px,92vw)] max-h-[92vh] overflow-auto"
    >
      <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
        <Icon name="plan" size={16} />
        <div className="flex-1">
          <p className="font-serif text-[20px] leading-tight text-ink">Crear plan</p>
          <p className="font-mono text-[11px] text-muted">Define nombre, comidas y precio</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-[34px] h-[34px] flex items-center justify-center border border-rule rounded-md bg-paper hover:bg-cream-2 transition-colors"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <div className="p-[22px]">
        <PlanEditorForm draft={draft} setDraft={setDraft} />
        <div className="flex gap-2.5 mt-[18px]">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} loading={isLoading} leftIcon="check">
            Crear plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
