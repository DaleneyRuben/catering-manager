import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import type { Plan } from '../../types/client';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PlanEditorForm } from './PlanEditorForm';
import type { MealKey, PlanDraft } from './types';

export function PlanEditModal({
  plan,
  clientCount,
  isSaving,
  onSave,
  onDelete,
  onClose,
}: {
  plan: Plan;
  clientCount: number;
  isSaving: boolean;
  onSave: (draft: PlanDraft) => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PlanDraft>({
    name: plan.name,
    meals: plan.meals as MealKey[],
    price: String(plan.price),
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
            <p className="font-serif text-[20px] leading-tight text-ink">Editar plan</p>
            <p className="font-mono text-[11px] text-muted">{plan.name}</p>
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
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isSaving}
              className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-warn hover:bg-cream-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => onSave(draft)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name="check" size={14} />
              )}
              Guardar cambios
            </button>
          </div>

          <p className="font-mono text-[11px] text-muted mt-3.5 px-3 py-2.5 bg-cream-2 rounded-md">
            ⓘ Modificar este plan afectará a {clientCount} cliente
            {clientCount !== 1 ? 's' : ''} con contrato vigente.
          </p>
        </div>
      </div>

      {confirmDeleteOpen && (
        <ConfirmDeleteModal
          planName={plan.name}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
