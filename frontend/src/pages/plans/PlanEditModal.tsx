import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import type { Plan } from '../../types/client';
import { PlanEditorForm } from './PlanEditorForm';
import type { MealKey, PlanDraft } from './types';

export function PlanEditModal({
  plan,
  clientCount,
  isSaving,
  onSave,
  onClose,
}: {
  plan: Plan;
  clientCount: number;
  isSaving: boolean;
  onSave: (draft: PlanDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PlanDraft>({
    name: plan.name,
    meals: plan.meals as MealKey[],
    price: String(plan.price),
  });

  const clientsLabel = clientCount === 1 ? '1 cliente activo' : `${clientCount} clientes activos`;

  return (
    <Modal onClose={onClose} className="w-[min(520px,92vw)] max-h-[92vh] overflow-auto">
      <div className="flex items-center gap-3 px-[28px] py-[22px] border-b border-[#e4e1d3]">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="plan" size={17} stroke={1.8} />
        </span>
        <div className="flex-1">
          <h3 className="font-serif font-semibold text-[23px] leading-none text-ink">
            Editar plan
          </h3>
          <p className="font-mono text-[11px] text-faint mt-[3px]">
            {plan.name} · {clientsLabel}
          </p>
        </div>
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
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(draft)} loading={isSaving} leftIcon="check">
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}
