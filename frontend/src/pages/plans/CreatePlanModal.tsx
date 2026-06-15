import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
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
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-paper transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-400 text-olive-900 rounded-md hover:bg-[#7ed427] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Icon name="check" size={14} />
            )}
            Crear plan
          </button>
        </div>
      </div>
    </Modal>
  );
}
