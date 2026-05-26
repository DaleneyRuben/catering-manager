import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { PlanEditorForm } from './PlanEditorForm';
import type { PlanDraft } from './types';

export function CreatePlanModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: PlanDraft) => void;
}) {
  const [draft, setDraft] = useState<PlanDraft>({ name: '', meals: [], price: '0' });

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
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-cream border border-rule-2 rounded-[10px] w-[min(640px,92vw)] max-h-[92vh] overflow-auto shadow-[0_20px_60px_rgba(20,40,6,0.25)]"
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
              className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-paper transition-colors"
            >
              Cancelar
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-400 text-olive-900 rounded-md hover:bg-[#7ed427] transition-colors"
            >
              <Icon name="check" size={14} />
              Crear plan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
