import { useEffect, useRef, useState } from 'react';
import { Button } from '@ui/Button';
import { inputCls } from '@ui/Field';
import type { ExpenseCategoryWithUsage } from '@/features/finance/types';

interface Props {
  category: ExpenseCategoryWithUsage;
  onRename: (id: string, name: string) => Promise<unknown>;
  // The row reports the intent and the modal owns the confirm: stating what archiving leaves
  // untouched needs the month's arithmetic, which lives a level up.
  onArchive: (category: ExpenseCategoryWithUsage) => void;
  onRestore: (id: string) => void;
}

// Inline styles rather than size classes, so the design's exact padding wins over Button's
// defaults deterministically (the same approach as the other bare action buttons).
const ACTION_STYLE = { padding: '6px 9px', fontSize: '12.5px' };
const RESTORE_STYLE = { padding: '6px 12px', fontSize: '12.5px' };
const SAVE_STYLE = { padding: '7px 13px', fontSize: '12px' };
const CANCEL_STYLE = { padding: '7px 4px', fontSize: '12px' };

// What the row says about itself before anyone decides to archive it. This month is the figure
// that matters — the register on screen — and the historial is the fallback for a category that
// has been idle since.
const usageLabel = ({ usageThisMonth, usageAllTime }: ExpenseCategoryWithUsage): string => {
  if (usageThisMonth > 0)
    return `${usageThisMonth} ${usageThisMonth === 1 ? 'gasto' : 'gastos'} este mes`;
  if (usageAllTime > 0)
    return `${usageAllTime} ${usageAllTime === 1 ? 'gasto' : 'gastos'} en el historial`;
  return 'Sin uso';
};

export function CategoryManagerRow({ category, onRename, onArchive, onRestore }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = draft !== null;

  // Keyed on entering edit mode rather than on the draft itself: refocusing and reselecting on
  // every keystroke would fight the caret.
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const trimmed = draft?.trim() ?? '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmed === '') return;

    // Re-submitting the name it already has is not a correction, so it closes without reporting
    // that the historial was updated.
    if (trimmed === category.name) {
      setDraft(null);
      return;
    }

    try {
      await onRename(category.id, trimmed);
      setDraft(null);
    } catch {
      // A taken name comes back as a 409 the user has to act on (the message is toasted globally),
      // so the input stays open with what they typed still in it.
    }
  };

  const usage = (
    <span data-testid="category-usage" className="font-mono text-[10.5px] text-placeholder">
      {usageLabel(category)}
    </span>
  );

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 items-center py-[9px] border-b border-cream-2"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Nuevo nombre"
          className={`${inputCls()} flex-1 !py-[7px] !px-[11px] !text-[13px] !rounded-[7px] border-olive-600`}
        />
        <Button
          type="submit"
          disabled={trimmed === ''}
          style={SAVE_STYLE}
          className="rounded-[7px]"
        >
          Guardar
        </Button>
        <Button variant="secondary" onClick={() => setDraft(null)} style={CANCEL_STYLE}>
          Cancelar
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2.5 py-[9px] border-b border-cream-2">
      <span className="flex-1 min-w-0 flex items-baseline gap-2.5">
        {/* An archived category reads as retired rather than gone — it still owns every expense
            filed against it, and the same muting marks an archived client in the list. */}
        <span className={`text-[13.5px] ${category.active ? 'text-ink' : 'text-empty-text'}`}>
          {category.name}
        </span>
        {usage}
      </span>

      {category.active ? (
        <>
          <Button
            variant="bare"
            aria-label={`Renombrar ${category.name}`}
            onClick={() => setDraft(category.name)}
            className="text-muted rounded-[7px] hover:bg-cream-2 hover:text-ink cursor-pointer"
            style={ACTION_STYLE}
          >
            Renombrar
          </Button>
          <Button
            variant="bare"
            aria-label={`Archivar ${category.name}`}
            onClick={() => onArchive(category)}
            className="text-muted rounded-[7px] hover:bg-danger-bg hover:text-danger cursor-pointer"
            style={ACTION_STYLE}
          >
            Archivar
          </Button>
        </>
      ) : (
        <Button
          variant="bare"
          aria-label={`Restaurar ${category.name}`}
          onClick={() => onRestore(category.id)}
          className="border border-rule text-ink-2 rounded-[7px] hover:bg-olive-50 hover:border-olive-300 cursor-pointer"
          style={RESTORE_STYLE}
        >
          Restaurar
        </Button>
      )}
    </div>
  );
}
