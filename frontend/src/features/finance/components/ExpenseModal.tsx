import { useEffect, useRef, useState } from 'react';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Field, inputCls } from '@ui/Field';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import { CategoryChips } from '@/features/finance/components/CategoryChips';
import type { ExpenseCategory, ExpenseInput } from '@/features/finance/types';

export interface EditableExpense {
  id: string;
  amount: number;
  categoryId: string;
  spentAt: string;
  description: string | null;
}

interface Props {
  // Ranked by the server, most used this month first, and shown in that order as chips.
  categories: ExpenseCategory[];
  today: string;
  // Revises the row itself.
  expense?: EditableExpense;
  // Seeds the same fields but creates a new row dated today — the daily-delivery path.
  duplicateOf?: EditableExpense;
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
  duplicateOf,
  defaultCategoryId,
  onSubmit,
  onClose,
  isSaving = false,
}: Props) {
  const isEdit = expense !== undefined;
  const amountRef = useRef<HTMLInputElement>(null);

  // Both modes seed from a row, but only an edit inherits its date: a duplicate is today's
  // expense, which is the whole reason the action exists.
  const source = expense ?? duplicateOf;

  const [amount, setAmount] = useState(source ? String(source.amount) : '');
  const [pickedId, setPickedId] = useState(source?.categoryId ?? '');
  const [spentAt, setSpentAt] = useState(expense?.spentAt ?? today);
  const [description, setDescription] = useState(source?.description ?? '');

  const active = categories.filter((category) => category.active);

  // A remembered category is a convenience, not a record: archiving it stops it being offered, so a
  // new expense must not be filed against it. The category on a row being edited is different — it
  // is what that expense was actually filed against, and rides through in `pickedId`.
  const remembered = active.some((category) => category.id === defaultCategoryId)
    ? defaultCategoryId
    : undefined;

  // Resolved on render rather than seeded into state: the catalog can still be in flight when the
  // form opens, and a state seeded from an empty list would stay empty after it arrived. The first
  // chip is the server's ranking — the category used most this month.
  const categoryId = pickedId || remembered || active[0]?.id || '';

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
              className={`${inputCls()} pl-10 font-sans tabular-nums text-[17px]`}
            />
          </div>
        </Field>

        <CategoryChips categories={categories} selectedId={categoryId} onPick={setPickedId} />

        {/* Paired on one row: both are short, and the chip row above is tall enough that stacking
            them pushed the buttons off a laptop screen. */}
        <div className="flex gap-3.5">
          <div className="w-[170px] shrink-0">
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
          </div>
          <div className="flex-1 min-w-0">
            <Field label="Descripción (opcional)" htmlFor="expense-description" variant="plain">
              <input
                id="expense-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls()}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-0.5">
          <Button type="button" variant="secondary" onClick={onClose} style={MODAL_CANCEL_STYLE}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!isValid} loading={isSaving} style={MODAL_CONFIRM_STYLE}>
            {isEdit ? 'Guardar' : 'Registrar'}
            {/* Enter still submits; the caption that used to say so was noise on a form filled
                daily, so the affordance is this glyph. Decorative — out of the accessible name. */}
            <span aria-hidden="true" className="font-mono text-[12px] opacity-[.55]">
              ↵
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
