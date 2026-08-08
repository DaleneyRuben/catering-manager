import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@ui/Button';
import { inputCls } from '@ui/Field';
import { useCategoryMutations } from '@/features/finance/hooks/useCategories';
import { categoryAddedMessage } from '@/features/finance/utils/categories';
import type { ExpenseCategory } from '@/features/finance/types';

interface Props {
  // In the order the server ranked them — most used this month first (backlog 3.24). Never
  // re-sorted here, or the form and the categories modal would disagree about the same catalog.
  categories: ExpenseCategory[];
  selectedId: string;
  onPick: (id: string) => void;
}

const CHIP_STYLE = { padding: '8px 13px', fontSize: '13px' };
const ADD_STYLE = { padding: '9px 15px', fontSize: '12.5px' };
const CANCEL_STYLE = { padding: '9px 6px', fontSize: '12.5px' };

const CHIP_CLS = 'rounded-lg border transition-colors';
const SELECTED_CLS = 'border-olive-700 bg-olive-700 text-white font-semibold';
const UNSELECTED_CLS = 'border-rule bg-white text-ink-2 font-medium hover:border-rule-2';

export function CategoryChips({ categories, selectedId, onPick }: Props) {
  const { create } = useCategoryMutations();
  const [draft, setDraft] = useState<string | null>(null);
  const draftRef = useRef<HTMLInputElement>(null);

  const isAdding = draft !== null;

  useEffect(() => {
    if (isAdding) draftRef.current?.focus();
  }, [isAdding]);

  // An archived category is not offered any more, but the one an expense was already filed against
  // stays on screen: editing that expense would otherwise look like nothing had been chosen.
  const chips = categories.filter((category) => category.active || category.id === selectedId);

  const name = (draft ?? '').trim();

  const handleAdd = async () => {
    if (name === '') return;

    try {
      const added = await create(name);
      toast.success(categoryAddedMessage(added, categories));
      onPick(added.id);
      setDraft(null);
    } catch {
      // The field stays open so the name can be retried; the failure is toasted globally.
    }
  };

  // The field sits inside the expense form: Enter would file the expense and Escape would reach the
  // modal's own document listener and close the whole form, so both stop here.
  const handleKeyDown = async (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;

    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') setDraft(null);
    else await handleAdd();
  };

  return (
    <fieldset>
      <legend className="text-[11px] text-faint mb-1.5">Categoría</legend>

      <div className="flex flex-wrap gap-[7px]">
        {chips.map((category) => (
          <Button
            key={category.id}
            variant="bare"
            aria-pressed={category.id === selectedId}
            onClick={() => onPick(category.id)}
            style={CHIP_STYLE}
            className={`${CHIP_CLS} ${category.id === selectedId ? SELECTED_CLS : UNSELECTED_CLS}`}
          >
            {category.name}
          </Button>
        ))}

        {!isAdding && (
          <Button
            variant="bare"
            leftIcon="plus"
            size="sm"
            onClick={() => setDraft('')}
            style={CHIP_STYLE}
            className={`${CHIP_CLS} border-dashed border-rule-2 text-muted hover:border-olive-600 hover:text-olive-700`}
          >
            Nueva
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex gap-2 mt-[9px]">
          <input
            ref={draftRef}
            value={draft ?? ''}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Nombre de la nueva categoría"
            className={`${inputCls()} flex-1`}
          />
          <Button onClick={handleAdd} disabled={name === ''} style={ADD_STYLE}>
            Agregar
          </Button>
          <Button variant="secondary" onClick={() => setDraft(null)} style={CANCEL_STYLE}>
            Cancelar
          </Button>
        </div>
      )}
    </fieldset>
  );
}
