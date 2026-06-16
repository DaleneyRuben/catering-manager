import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Field, inputCls } from '../../components/ui/Field';
import type { MenuDraft } from '../../types/menu';
import { MEAL_FIELDS, MEAL_FIELD_LABELS, emptyDraft, type MealField } from './menuFields';

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  dateLabel: string;
  initial: MenuDraft | null;
  onSave: (draft: MenuDraft) => Promise<void>;
  isSaving: boolean;
}

export function MenuFormModal({
  open,
  onClose,
  date,
  dateLabel,
  initial,
  onSave,
  isSaving,
}: Props) {
  const [draft, setDraft] = useState<MenuDraft>(initial ?? emptyDraft(date));

  useEffect(() => {
    if (open) setDraft(initial ?? emptyDraft(date));
  }, [open, initial, date]);

  const handleFieldChange = (field: MealField, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value || null }));
  };

  const handleSave = async () => {
    await onSave({ ...draft, date });
    onClose();
  };

  if (!open) return null;

  return (
    <Modal
      onClose={onClose}
      className="rounded-[10px] w-[min(640px,92vw)] max-h-[92vh] overflow-auto"
    >
      <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
        <Icon name="chef" size={16} />
        <div className="flex-1">
          <p className="font-serif text-[20px] leading-tight text-ink">
            {initial ? 'Editar menú' : 'Cargar menú'}
          </p>
          <p className="font-mono text-[11px] text-muted">{dateLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="w-[34px] h-[34px] flex items-center justify-center border border-rule rounded-md bg-paper hover:bg-cream-2 transition-colors"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <div className="p-[22px]">
        <div className="grid grid-cols-2 gap-4">
          {MEAL_FIELDS.map((field) => (
            <Field key={field} label={MEAL_FIELD_LABELS[field]} htmlFor={`menu-field-${field}`}>
              <input
                id={`menu-field-${field}`}
                type="text"
                value={draft[field] ?? ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className={inputCls()}
              />
            </Field>
          ))}
        </div>

        <div className="flex gap-2.5 mt-[18px]">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSave} loading={isSaving} leftIcon="check">
            {initial ? 'Actualizar menú' : 'Guardar menú'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
