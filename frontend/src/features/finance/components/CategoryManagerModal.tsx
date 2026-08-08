import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { IconButton } from '@ui/IconButton';
import { ConfirmModal } from '@ui/ConfirmModal';
import { inputCls } from '@ui/Field';
import { MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import { useCategoryCatalog, useCategoryMutations } from '@/features/finance/hooks/useCategories';
import { CategoryManagerRow } from '@/features/finance/components/CategoryManagerRow';
import { formatMoney, formatMonthLabel } from '@/features/finance/utils/format';
import type { CategoryTotal, ExpenseCategoryWithUsage } from '@/features/finance/types';

interface Props {
  // The month on screen: usage lines describe the register the user is looking at, not today's
  // calendar month.
  month: string;
  // The month's per-category totals, which is what lets the archive confirm state the arithmetic
  // that stays put instead of warning vaguely.
  byCategory: CategoryTotal[];
  onClose: () => void;
}

const SECTION_CLS = 'font-mono text-[9.5px] tracking-[.16em] uppercase text-faint pt-2.5 pb-1.5';

// Archiving destroys nothing, so the confirm states what carries on rather than what is at risk.
const archiveMessage = (
  category: ExpenseCategoryWithUsage,
  monthLabel: string,
  total: number,
): string => {
  if (category.usageThisMonth === 0)
    return `No hay gastos de ${monthLabel} en ${category.name}. Los del historial, si los hay, no cambian.`;

  const [subject, unchanged, appears] =
    category.usageThisMonth === 1
      ? ['El gasto', 'no cambia: sigue sumando', 'y sigue apareciendo']
      : [
          `Los ${category.usageThisMonth} gastos`,
          'no cambian: siguen sumando',
          'y siguen apareciendo',
        ];

  return `${subject} de ${monthLabel} en ${category.name} ${unchanged} Bs ${formatMoney(total)} a los egresos del mes ${appears} en el desglose y en el historial.`;
};

export function CategoryManagerModal({ month, byCategory, onClose }: Props) {
  const { categories, isLoading } = useCategoryCatalog(month);
  const { create, rename, archive, restore } = useCategoryMutations();

  const [newName, setNewName] = useState('');
  const [pendingArchive, setPendingArchive] = useState<ExpenseCategoryWithUsage | null>(null);

  const active = categories.filter((category) => category.active);
  const archived = categories.filter((category) => !category.active);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (name === '') return;

    const created = await create(name);

    // A duplicate name folds onto the category that already answers to it rather than erroring, so
    // what came back may be a row that was already there — and if it was archived, the fold
    // restored it. Comparing against the catalog as it stood says which of the three happened.
    const known = categories.find((category) => category.id === created.id);
    if (known === undefined) toast.success(`Categoría «${created.name}» creada`);
    else if (known.active) toast.success(`Ya existe la categoría «${created.name}»`);
    else toast.success(`Categoría «${created.name}» restaurada`);

    setNewName('');
  };

  // Not caught: the row keeps its input open on a rejection so a name already taken can be
  // corrected, and the message is toasted globally.
  const handleRename = async (id: string, name: string) => {
    await rename(id, name);
    toast.success('Nombre actualizado en todo el historial');
  };

  const handleRestore = async (id: string) => {
    await restore(id);
    toast.success('Categoría restaurada');
  };

  const handleArchive = async () => {
    if (!pendingArchive) return;
    await archive(pendingArchive.id);
    toast.success('Categoría archivada');
  };

  const rows = (list: ExpenseCategoryWithUsage[]) =>
    list.map((category) => (
      <CategoryManagerRow
        key={category.id}
        category={category}
        onRename={handleRename}
        onArchive={setPendingArchive}
        onRestore={handleRestore}
      />
    ));

  return (
    <>
      <Modal onClose={onClose} className="w-full max-w-[520px] overflow-hidden">
        <div className="px-[26px] pt-[22px] pb-[18px] border-b border-cream-2 flex items-start gap-3.5">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-semibold text-2xl leading-[1.1] text-ink">
              Categorías de gasto
            </h3>
            {/* Both consequences up front: these are the two questions anyone opening this modal
                is about to ask. */}
            <p className="text-[12.5px] text-faint leading-[1.5] mt-[5px]">
              Renombrar corrige el nombre en todo el historial. Archivar la saca del formulario sin
              tocar los gastos ya registrados.
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

        <form onSubmit={handleAdd} className="px-[26px] pt-[18px] pb-2 flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            aria-label="Nueva categoría"
            className={`${inputCls()} flex-1`}
          />
          <Button type="submit" disabled={newName.trim() === ''} style={MODAL_CONFIRM_STYLE}>
            Agregar
          </Button>
        </form>

        <div className="max-h-[44vh] overflow-auto px-[26px] pt-2 pb-1">
          {isLoading ? (
            <p className="font-mono text-[10.5px] text-placeholder py-3">Cargando categorías…</p>
          ) : (
            <>
              <div className={SECTION_CLS}>Activas · {active.length}</div>
              {rows(active)}

              {/* With nothing archived the section is noise: there is nothing to restore. */}
              {archived.length > 0 && (
                <>
                  <div className={`${SECTION_CLS} pt-[18px]`}>Archivadas · {archived.length}</div>
                  {rows(archived)}
                </>
              )}
            </>
          )}
        </div>

        <div className="px-[26px] pt-4 pb-5 flex justify-end">
          <Button onClick={onClose} style={MODAL_CONFIRM_STYLE}>
            Listo
          </Button>
        </div>
      </Modal>

      {pendingArchive && (
        <ConfirmModal
          title={`Archivar ${pendingArchive.name}`}
          message={archiveMessage(
            pendingArchive,
            formatMonthLabel(month).toLowerCase(),
            byCategory.find((row) => row.categoryId === pendingArchive.id)?.total ?? 0,
          )}
          details="Deja de aparecer al registrar un gasto nuevo. Puedes restaurarla cuando quieras."
          confirmLabel="Archivar"
          onClose={() => setPendingArchive(null)}
          onConfirm={handleArchive}
        />
      )}
    </>
  );
}
