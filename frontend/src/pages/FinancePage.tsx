import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PageHeader } from '@ui/PageHeader';
import { Button } from '@ui/Button';
import { Skeleton } from '@ui/Skeleton';
import { ConfirmModal } from '@ui/ConfirmModal';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { useExpenseCategories, useExpenseMutations } from '@/features/finance/hooks/useExpenses';
import { MonthSelector } from '@/features/finance/components/MonthSelector';
import { FinanceTiles } from '@/features/finance/components/FinanceTiles';
import { CategoryBreakdown } from '@/features/finance/components/CategoryBreakdown';
import { MovementsList } from '@/features/finance/components/MovementsList';
import { ExpenseModal } from '@/features/finance/components/ExpenseModal';
import type { EditableExpense } from '@/features/finance/components/ExpenseModal';
import { formatMoney, formatMonthLabel } from '@/features/finance/utils/format';
import type { ExpenseInput, Movement } from '@/features/finance/types';

function FinanceSkeleton() {
  return (
    <div data-testid="finance-skeleton" className="flex flex-col gap-6">
      <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 max-lg:grid-cols-1">
        {['income', 'expenses', 'balance'].map((key) => (
          <Skeleton key={key} className="h-[148px] rounded-[13px]" />
        ))}
      </div>
      <div className="grid grid-cols-[minmax(300px,1fr)_1.55fr] gap-[22px] items-start max-lg:grid-cols-1">
        <Skeleton className="h-[280px] rounded-[13px]" />
        <Skeleton className="h-[420px] rounded-[13px]" />
      </div>
    </div>
  );
}

// An expense movement carries the category in `label`; the modal needs its id, which the
// breakdown already lists by name for this month.
const toEditable = (
  movement: Movement,
  categoryId: string | undefined,
): EditableExpense | undefined =>
  categoryId
    ? {
        id: movement.id,
        amount: movement.amount,
        categoryId,
        spentAt: movement.date,
        description: movement.description,
      }
    : undefined;

export function FinancePage() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [month, setMonth] = useState(currentMonth);
  const [editing, setEditing] = useState<EditableExpense | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Movement | null>(null);
  const [lastCategoryId, setLastCategoryId] = useState<string | undefined>();

  const { overview, isLoading } = useFinance(month);
  const { categories } = useExpenseCategories();
  const { create, update, remove, isSaving } = useExpenseMutations();

  const categoryIdByName = (name: string) => categories.find((c) => c.name === name)?.id;

  const closeForm = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (input: ExpenseInput) => {
    if (editing) {
      await update(editing.id, input);
      toast.success('Gasto actualizado');
    } else {
      await create(input);
      toast.success('Gasto registrado');
    }
    setLastCategoryId(input.categoryId);
    closeForm();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    toast.success('Gasto eliminado');
  };

  const incomeCount = overview?.movements.filter((m) => m.kind === 'income').length ?? 0;
  const expenseCount = overview?.movements.filter((m) => m.kind === 'expense').length ?? 0;
  const isFormOpen = isCreating || editing !== null;

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:pt-[34px] lg:pb-[48px]">
      <PageHeader label="Administración" title="Finanzas" />

      <div className="flex items-center justify-between gap-5 flex-wrap mb-5">
        <MonthSelector
          month={month}
          earliestMonth={overview?.earliestMonth ?? currentMonth}
          currentMonth={currentMonth}
          onChange={setMonth}
        />
        {/* There is no "Registrar ingreso": all income is subscription revenue, written when an
            admin marks a subscription paid (ADR-008). */}
        <Button leftIcon="plus" onClick={() => setIsCreating(true)}>
          Registrar gasto
        </Button>
      </div>

      {isLoading || !overview ? (
        <FinanceSkeleton />
      ) : (
        <div className="flex flex-col gap-[26px]">
          <FinanceTiles
            income={overview.income}
            expenses={overview.expenses}
            balance={overview.balance}
            month={overview.month}
            incomeCount={incomeCount}
            expenseCount={expenseCount}
          />
          <div className="grid grid-cols-[minmax(300px,1fr)_1.55fr] gap-[22px] items-start max-lg:grid-cols-1">
            <CategoryBreakdown categories={overview.byCategory} />
            <MovementsList
              movements={overview.movements}
              onEdit={(movement) =>
                setEditing(toEditable(movement, categoryIdByName(movement.label)) ?? null)
              }
              onDelete={setPendingDelete}
            />
          </div>
        </div>
      )}

      {isFormOpen && (
        <ExpenseModal
          categories={categories}
          today={format(new Date(), 'yyyy-MM-dd')}
          expense={editing ?? undefined}
          defaultCategoryId={lastCategoryId}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSaving={isSaving}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Eliminar gasto"
          icon="trash"
          message={`${pendingDelete.label} · Bs ${formatMoney(pendingDelete.amount)} · ${formatMonthLabel(month)}`}
          details="Los totales del mes se recalculan."
          confirmLabel="Eliminar"
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
