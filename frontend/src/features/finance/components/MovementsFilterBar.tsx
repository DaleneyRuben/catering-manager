import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { formatMoney } from '@/features/finance/utils/format';
import { filterCategoryOptions, hasActiveFilters } from '@/features/finance/utils/filters';
import type { CategoryTotal, ExpenseCategory, MovementFilters } from '@/features/finance/types';

export interface FilterBarProps {
  filters: MovementFilters;
  categories: ExpenseCategory[];
  byCategory: CategoryTotal[];
  count: number;
  subtotal: number;
  onQueryChange: (q: string) => void;
  onDirectionChange: (direction: MovementFilters['direction']) => void;
  onCategoryChange: (categoryId: string) => void;
  onClearAll: () => void;
}

const DIRECTIONS: { value: MovementFilters['direction']; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
];

const CONTROL_CLS =
  'py-2 text-[13px] bg-white border border-rule rounded-lg outline-none text-ink focus:border-olive-600';

const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') e.currentTarget.blur();
};

// The chip reads as the filter it stands for; that it removes it on click is what the label says
// to a screen reader, since an "x" beside a word does not say which of the two it acts on.
function Chip({
  label,
  clearLabel,
  onClear,
}: {
  label: string;
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={clearLabel}
      onClick={onClear}
      className="inline-flex items-center gap-1.5 bg-filter-chip-bg border border-balance-up-border rounded-full pl-[11px] pr-[9px] py-1 text-[11.5px] text-filter-chip-text hover:bg-filter-chip-hover transition-colors"
    >
      {label}
      <Icon name="x" size={11} stroke={2.4} />
    </button>
  );
}

// The heading shares the filter row rather than sitting above it: the search field pushes off it
// with ml-auto, and the whole header stays one band instead of two stacked ones.
export function MovementsFilterBar({
  filters,
  categories,
  byCategory,
  count,
  subtotal,
  onQueryChange,
  onDirectionChange,
  onCategoryChange,
  onClearAll,
}: FilterBarProps) {
  const anyFilter = hasActiveFilters(filters);
  const options = filterCategoryOptions(categories, byCategory);
  const term = filters.q.trim();
  const pickedCategory = options.find((o) => o.id === filters.categoryId);
  const up = subtotal >= 0;

  return (
    <div className="px-6 pt-[18px] pb-3.5 border-b border-cream-2">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-serif font-semibold text-[21px] text-ink shrink-0">Movimientos</h2>

        <div className="relative flex-1 min-w-[170px] max-w-[280px] ml-auto max-md:ml-0 max-md:max-w-none max-md:basis-full">
          <Icon
            name="search"
            size={14}
            className="absolute left-[11px] top-1/2 -translate-y-1/2 text-placeholder pointer-events-none"
          />
          <input
            value={filters.q}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={blurOnEnter}
            aria-label="Buscar por descripción o cliente"
            className={`${CONTROL_CLS} w-full pl-8 pr-[30px]`}
          />
          {filters.q && (
            <IconButton
              icon="x"
              label="Limpiar búsqueda"
              onClick={() => onQueryChange('')}
              size={13}
              stroke={2}
              className="absolute right-[6px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-md text-faint hover:text-ink"
            />
          )}
        </div>

        <div className="flex gap-0.5 bg-movement-tag-bg rounded-[9px] p-[3px] shrink-0">
          {DIRECTIONS.map(({ value, label }) => {
            const on = filters.direction === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => onDirectionChange(value)}
                className={`rounded-[7px] px-[13px] py-1.5 text-[12.5px] transition-colors ${
                  on
                    ? 'bg-white text-ink font-semibold shadow-[var(--shadow-segment)]'
                    : 'text-muted font-medium hover:text-ink-2'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filters.direction === 'income' ? (
          // Income carries no category, so the control leaves and says why. An error message on a
          // select that can only answer with nothing would be the worse half of the same trade.
          <span className="shrink-0 px-[11px] py-2 text-[12.5px] text-empty-text bg-filter-note-bg border border-dashed border-rule rounded-lg">
            Los ingresos no llevan categoría
          </span>
        ) : (
          <select
            value={filters.categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filtrar por categoría"
            className={`${CONTROL_CLS} px-[11px] cursor-pointer max-w-[180px] min-w-0`}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center justify-between gap-3.5 mt-3 flex-wrap">
        <div className="flex items-center gap-[7px] flex-wrap min-h-6">
          {!anyFilter && (
            <span className="font-mono text-[10.5px] tracking-[.06em] uppercase text-faint">
              Más reciente primero
            </span>
          )}
          {filters.direction !== 'all' && (
            <Chip
              label={filters.direction === 'income' ? 'Solo ingresos' : 'Solo gastos'}
              clearLabel={`Quitar filtro ${filters.direction === 'income' ? 'Solo ingresos' : 'Solo gastos'}`}
              onClear={() => onDirectionChange('all')}
            />
          )}
          {pickedCategory && pickedCategory.id !== '' && (
            <Chip
              label={pickedCategory.label}
              clearLabel={`Quitar categoría ${pickedCategory.label}`}
              onClear={() => onCategoryChange('')}
            />
          )}
          {term && (
            <Chip
              label={`“${term}”`}
              clearLabel={`Quitar búsqueda ${term}`}
              onClear={() => onQueryChange('')}
            />
          )}
          {anyFilter && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-1.5 py-1 text-[11.5px] text-muted underline underline-offset-2 hover:text-ink transition-colors"
            >
              Limpiar todo
            </button>
          )}
        </div>

        <div className="flex items-baseline gap-3 font-mono text-[11px] text-muted">
          <span>{count === 1 ? '1 movimiento' : `${count} movimientos`}</span>
          <span className="text-rule-2">·</span>
          <span className="tracking-[.1em] uppercase text-[9.5px] text-faint">
            {anyFilter ? 'Subtotal' : 'Neto del mes'}
          </span>
          <span
            className={`text-[13.5px] font-semibold tabular-nums ${up ? 'text-olive-700' : 'text-danger'}`}
          >
            {up ? '+' : '−'}
            {formatMoney(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
