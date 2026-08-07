import { useEffect, useRef, useState } from 'react';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Field, inputCls, selectCls } from '@ui/Field';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import type { ExpenseCategory, ExpenseInput } from '@/features/finance/types';

export interface EditableExpense {
  id: string;
  amount: number;
  categoryId: string;
  spentAt: string;
  description: string | null;
}

interface Props {
  categories: ExpenseCategory[];
  today: string;
  expense?: EditableExpense;
  // Pre-selects the category the admin used last, so the daily entry is a number and Enter.
  defaultCategoryId?: string;
  onSubmit: (input: ExpenseInput) => Promise<unknown>;
  onClose: () => void;
  isSaving?: boolean;
}

export function ExpenseModal({
  categories,
  today,
  expense,
  defaultCategoryId,
  onSubmit,
  onClose,
  isSaving = false,
}: Props) {
  const isEdit = expense !== undefined;
  const amountRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [categoryId, setCategoryId] = useState(
    expense?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? '',
  );
  const [spentAt, setSpentAt] = useState(expense?.spentAt ?? today);
  const [description, setDescription] = useState(expense?.description ?? '');

  useEffect(() => {
    amountRef.current?.focus();
    amountRef.current?.select();
  }, []);

  const parsedAmount = parseFloat(amount);
  const isValid = parsedAmount > 0 && spentAt !== '' && spentAt <= today && categoryId !== '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid || isSaving) return;

    await onSubmit({
      amount: parsedAmount,
      categoryId,
      spentAt,
      description: description.trim() === '' ? null : description.trim(),
    });
  };

  return (
    <Modal onClose={onClose} className="w-full max-w-[460px] overflow-hidden">
      <div className="px-[26px] pt-[22px] pb-[18px] border-b border-cream-2 flex items-start gap-3.5">
        <span className="w-9 h-9 rounded-[9px] bg-expense-icon-bg text-danger flex items-center justify-center shrink-0">
          <Icon name="arrow-down" size={18} stroke={1.6} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-2xl leading-[1.1] text-ink">
            {isEdit ? 'Editar gasto' : 'Registrar gasto'}
          </h3>
          <p className="font-mono text-[10.5px] tracking-[.04em] text-faint mt-1">
            {isEdit
              ? 'Los totales del mes se recalculan'
              : 'Solo egresos — los ingresos los crea el cobro'}
          </p>
        </div>
        <IconButton
          icon="x"
          label="Cerrar"
          size={18}
          onClick={onClose}
          className="p-1 rounded-md text-faint hover:text-ink hover:bg-cream-2 cursor-pointer"
        />
      </div>

      <form onSubmit={handleSubmit} className="px-[26px] pt-[22px] pb-6 flex flex-col gap-[17px]">
        <Field label="Monto" htmlFor="expense-amount" variant="plain">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[12px] text-faint pointer-events-none">
              Bs
            </span>
            <input
              id="expense-amount"
              ref={amountRef}
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              placeholder="0.00"
              className={`${inputCls()} pl-10 font-mono text-[17px]`}
            />
          </div>
        </Field>

        <Field label="Categoría" htmlFor="expense-category" variant="plain">
          <select
            id="expense-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={selectCls()}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fecha" htmlFor="expense-date" variant="plain">
          <input
            id="expense-date"
            type="date"
            value={spentAt}
            max={today}
            onChange={(e) => setSpentAt(e.target.value)}
            className={`${inputCls()} font-mono`}
          />
        </Field>

        <Field label="Descripción (opcional)" htmlFor="expense-description" variant="plain">
          <input
            id="expense-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Reparto del día, verdulería…"
            className={inputCls()}
          />
        </Field>

        <div className="flex items-center justify-end gap-2.5 pt-0.5">
          <span className="mr-auto font-mono text-[10px] tracking-[.04em] text-placeholder">
            Enter para guardar
          </span>
          <Button type="button" variant="secondary" onClick={onClose} style={MODAL_CANCEL_STYLE}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!isValid} loading={isSaving} style={MODAL_CONFIRM_STYLE}>
            {isEdit ? 'Guardar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
