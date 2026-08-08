import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PageHeader } from '@ui/PageHeader';
import { Button } from '@ui/Button';
import { Skeleton } from '@ui/Skeleton';
import { ConfirmModal } from '@ui/ConfirmModal';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { useMovementFilters } from '@/features/finance/hooks/useMovementFilters';
import { useExpenseMutations } from '@/features/finance/hooks/useExpenses';
import { useCategoryCatalog } from '@/features/finance/hooks/useCategories';
import { MonthSelector } from '@/features/finance/components/MonthSelector';
import { FinanceTiles } from '@/features/finance/components/FinanceTiles';
import { CategoryBreakdown } from '@/features/finance/components/CategoryBreakdown';
import { MovementsList } from '@/features/finance/components/MovementsList';
import { ExpenseModal } from '@/features/finance/components/ExpenseModal';
import type { EditableExpense } from '@/features/finance/components/ExpenseModal';
import { CategoryManagerModal } from '@/features/finance/components/CategoryManagerModal';
import { OpenMonthPill } from '@/features/finance/components/OpenMonthPill';
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
      <Skeleton className="h-[190px] rounded-[13px]" />
      <Skeleton className="h-[460px] rounded-[13px]" />
    </div>
  );
}

// The row states the category it was filed against, so the form opens on that one rather than on
// whichever category currently answers to the same name.
const toEditable = (movement: Movement): EditableExpense | undefined =>
  movement.categoryId
    ? {
        id: movement.id,
        amount: movement.amount,
        categoryId: movement.categoryId,
        spentAt: movement.date,
        description: movement.description,
      }
    : undefined;

// One expense form serves three intents: a blank one, a revision of a row, and a copy of a row
// dated today.
type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; expense: EditableExpense }
  | { mode: 'duplicate'; expense: EditableExpense };

export function FinancePage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = today.slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [form, setForm] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Movement | null>(null);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [lastCategoryId, setLastCategoryId] = useState<string | undefined>();

  // Filters live above the month so paging back and forth keeps them: reading one category across
  // months is exactly why someone narrows the list.
  const { filters, queryFilters, setQuery, setDirection, pickCategory, clearAll } =
    useMovementFilters();

  const { overview, isLoading } = useFinance(month, queryFilters);
  // One catalog for the screen, read for the month on show: the form's chip order is the server's
  // ranking of that month's use, and the filter select and categories modal read the same rows.
  const { categories } = useCategoryCatalog(month);
  const { create, update, remove, isSaving } = useExpenseMutations();

  const closeForm = () => setForm(null);

  // A duplicate creates; only an edit revises the row it came from.
  const handleSubmit = async (input: ExpenseInput) => {
    if (form?.mode === 'edit') {
      await update(form.expense.id, input);
      toast.success('Gasto actualizado');
    } else {
      await create(input);
      toast.success('Gasto registrado');
    }
    setLastCategoryId(input.categoryId);
    // Follow the row out of the month on screen rather than filing it out of sight: a gasto
    // backdated into another month would otherwise land somewhere the user is not looking.
    setMonth(input.spentAt.slice(0, 7));
    closeForm();
  };

  const openFor = (mode: 'edit' | 'duplicate') => (movement: Movement) => {
    const expense = toEditable(movement);
    if (expense) setForm({ mode, expense });
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    toast.success('Gasto eliminado');
  };

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:pt-[34px] lg:pb-[48px]">
      <PageHeader label="Administración" title="Finanzas" />

      <div className="flex items-center justify-between gap-5 flex-wrap mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <MonthSelector
            month={month}
            earliestMonth={overview?.earliestMonth ?? currentMonth}
            currentMonth={currentMonth}
            onChange={setMonth}
          />
          {/* Only on the month still running, and absent entirely otherwise — paging back should
              read as settled, not as a marker that switched off. */}
          {month === currentMonth && <OpenMonthPill />}
        </div>
        {/* There is no "Registrar ingreso": all income is subscription revenue, written when an
            admin marks a subscription paid (ADR-008). */}
        <Button leftIcon="plus" onClick={() => setForm({ mode: 'create' })}>
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
            incomeCount={overview.incomeCount}
            expenseCount={overview.expenseCount}
            asOf={month === currentMonth ? today : undefined}
          />
          {/* Stacked full-width bands rather than two columns: with a full month of movements the
              breakdown column sat mostly empty, and with an empty month the list column did. */}
          <CategoryBreakdown
            categories={overview.byCategory}
            activeCategoryId={filters.categoryId}
            onPick={pickCategory}
            onManage={() => setIsManagingCategories(true)}
          />
          <MovementsList
            movements={overview.movements}
            month={overview.month}
            monthCount={overview.incomeCount + overview.expenseCount}
            filters={{
              filters,
              categories,
              byCategory: overview.byCategory,
              count: overview.count,
              subtotal: overview.subtotal,
              onQueryChange: setQuery,
              onDirectionChange: setDirection,
              onCategoryChange: pickCategory,
              onClearAll: clearAll,
            }}
            onEdit={openFor('edit')}
            onDuplicate={openFor('duplicate')}
            onDelete={setPendingDelete}
          />
        </div>
      )}

      {form && (
        <ExpenseModal
          categories={categories}
          today={today}
          expense={form.mode === 'edit' ? form.expense : undefined}
          duplicateOf={form.mode === 'duplicate' ? form.expense : undefined}
          defaultCategoryId={lastCategoryId}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSaving={isSaving}
        />
      )}

      {/* The month on screen goes with it: usage lines and the archive arithmetic describe the
          register the user is looking at, not today's calendar month. */}
      {isManagingCategories && overview && (
        <CategoryManagerModal
          month={month}
          byCategory={overview.byCategory}
          onClose={() => setIsManagingCategories(false)}
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
