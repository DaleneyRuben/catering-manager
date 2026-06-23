import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import type { Plan } from '../../types/client';
import { PlanEditorForm } from './PlanEditorForm';
import type { MealKey, PlanDraft } from './types';

const EMPTY_DRAFT: PlanDraft = { name: '', meals: [], price: '0' };

type CreateProps = {
  mode: 'create';
  isSaving: boolean;
  onSave: (draft: PlanDraft) => Promise<void>;
  onClose: () => void;
};

type EditProps = {
  mode: 'edit';
  plan: Plan;
  clientCount: number;
  isSaving: boolean;
  onSave: (draft: PlanDraft) => Promise<void>;
  onClose: () => void;
};

type Props = CreateProps | EditProps;

export function PlanModal(props: Props) {
  const { mode, onClose, isSaving, onSave } = props;
  const plan = mode === 'edit' ? (props as EditProps).plan : null;
  const clientCount = mode === 'edit' ? (props as EditProps).clientCount : 0;

  const [draft, setDraft] = useState<PlanDraft>(
    plan
      ? { name: plan.name, meals: plan.meals as MealKey[], price: String(plan.price) }
      : EMPTY_DRAFT,
  );

  const clientsLabel = clientCount === 1 ? '1 cliente activo' : `${clientCount} clientes activos`;

  const handleSubmit = async () => {
    await onSave(draft);
    onClose();
  };

  return (
    <Modal onClose={onClose} className="w-[min(520px,92vw)] max-h-[92vh] overflow-auto">
      <div className="flex items-center gap-3 px-[28px] py-[22px] border-b border-hairline">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="plan" size={17} stroke={1.8} />
        </span>
        <div className="flex-1">
          <h3 className="font-serif font-semibold text-[23px] leading-none text-ink">
            {mode === 'create' ? 'Nuevo plan' : 'Editar plan'}
          </h3>
          {mode === 'edit' && (
            <p className="font-mono text-[11px] text-faint mt-[3px]">
              {plan!.name} · {clientsLabel}
            </p>
          )}
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
          <Button onClick={handleSubmit} loading={isSaving} leftIcon="check">
            {mode === 'create' ? 'Crear plan' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
