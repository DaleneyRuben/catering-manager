import { formatMonthLabel } from '@/features/finance/utils/format';
import type { CategoryTotal, ExpenseCategory, MovementFilters } from '@/features/finance/types';

export interface FilterCategoryOption {
  id: string;
  label: string;
}

export const hasActiveFilters = (filters: MovementFilters): boolean =>
  filters.direction !== 'all' || filters.categoryId !== '' || filters.q.trim() !== '';

// The select offers what a row on screen can actually be filed against: every category still in
// use, plus any archived one this month was spent on. Leaving the second kind out would strand
// rows that no filter can reach.
export const filterCategoryOptions = (
  categories: ExpenseCategory[],
  byCategory: CategoryTotal[],
): FilterCategoryOption[] => {
  const active = categories.filter((c) => c.active);
  const activeIds = new Set(active.map((c) => c.id));

  const archivedButSpent = byCategory
    .filter((c) => !c.active && !activeIds.has(c.categoryId))
    .map((c) => ({ id: c.categoryId, name: `${c.categoryName} (archivada)` }));

  const options = [...active.map((c) => ({ id: c.id, name: c.name })), ...archivedButSpent].sort(
    (a, b) => a.name.localeCompare(b.name, 'es'),
  );

  return [
    { id: '', label: 'Todas las categorías' },
    ...options.map((o) => ({ id: o.id, label: o.name })),
  ];
};

// The count is the month's, not the filtered list's: the sentence exists to say there is something
// here, just not this. Naming zero would be the other empty state's job.
export const noMatchHint = (
  monthCount: number,
  month: string,
  filters: MovementFilters,
): string => {
  const unit = monthCount === 1 ? 'movimiento' : 'movimientos';
  const label = formatMonthLabel(month).toLowerCase();

  const bits: string[] = [];
  if (filters.q.trim()) bits.push('otra palabra');
  if (filters.direction !== 'all' || filters.categoryId) bits.push('otro filtro');

  // "con" leads the sentence and repeats before the second suggestion, so each bit stays a bare
  // noun phrase rather than carrying its own preposition.
  return `Hay ${monthCount} ${unit} en ${label}, pero ninguno pasa este filtro. Prueba con ${
    bits.join(' o con ') || 'otro filtro'
  }.`;
};
