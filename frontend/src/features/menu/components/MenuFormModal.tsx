import { useState, useEffect } from 'react';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Icon } from '@ui/Icon';
import { Field, inputCls } from '@ui/Field';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import type { MenuDraft } from '@/features/menu/types';
import {
  MEAL_FIELDS,
  MEAL_FIELD_LABELS,
  emptyDraft,
  type MealField,
} from '@/features/menu/menuFields';

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
    <Modal onClose={onClose} className="w-[min(600px,92vw)] max-h-[92vh] overflow-auto">
      <div className="flex items-center justify-between gap-3 px-[28px] py-[22px] border-b border-hairline">
        <p className="font-serif font-semibold text-[24px] leading-none text-ink">{dateLabel}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="p-1 flex items-center justify-center text-faint hover:text-ink-2 transition-colors"
        >
          <Icon name="x" size={20} stroke={1.8} />
        </button>
      </div>

      <div className="px-[28px] py-[22px] grid grid-cols-2 grid-rows-4 grid-flow-col gap-4">
        {MEAL_FIELDS.map((field) => (
          <Field
            key={field}
            label={
              field === 'afternoonSnack'
                ? `${MEAL_FIELD_LABELS[field]} (fruta)`
                : MEAL_FIELD_LABELS[field]
            }
            htmlFor={`menu-field-${field}`}
          >
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

      <div className="flex justify-end gap-[10px] px-[28px] py-4 border-t border-hairline">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isSaving}
          style={MODAL_CANCEL_STYLE}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          loading={isSaving}
          leftIcon="check"
          style={MODAL_CONFIRM_STYLE}
        >
          Guardar
        </Button>
      </div>
    </Modal>
  );
}
