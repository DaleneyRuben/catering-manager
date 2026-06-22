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
    <Modal onClose={onClose} className="w-[min(520px,92vw)] max-h-[92vh] overflow-auto">
      <div className="flex items-center gap-3 px-[28px] py-[22px] border-b border-[#e4e1d3]">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="plan" size={17} stroke={1.8} />
        </span>
        <h3 className="flex-1 font-serif font-semibold text-[23px] leading-none text-ink">
          Nuevo plan
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="p-1 flex items-center justify-center text-faint hover:text-ink-2 transition-colors"
        >
          <Icon name="x" size={20} stroke={1.8} />
        </button>
      </div>

      <div className="px-[28px] py-[22px]">
        <PlanEditorForm draft={draft} setDraft={setDraft} />
        <div className="flex justify-end gap-2.5 mt-[18px]">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={isLoading} leftIcon="check">
            Crear plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
