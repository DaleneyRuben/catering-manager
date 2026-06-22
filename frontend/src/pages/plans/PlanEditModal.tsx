import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
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
      <Modal onClose={onClose} className="w-[min(640px,92vw)] max-h-[92vh] overflow-auto">
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
            <Button variant="danger" onClick={() => setConfirmDeleteOpen(true)} disabled={isSaving}>
              Eliminar
            </Button>
            <div className="flex-1" />
            <Button onClick={() => onSave(draft)} loading={isSaving} leftIcon="check">
              Guardar cambios
            </Button>
          </div>

          <p className="font-mono text-[11px] text-muted mt-3.5 px-3 py-2.5 bg-cream-2 rounded-md">
            ⓘ Modificar este plan afectará a {clientCount} cliente
            {clientCount !== 1 ? 's' : ''} con contrato vigente.
          </p>
        </div>
      </Modal>

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
