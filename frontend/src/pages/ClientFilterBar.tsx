import { useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { CLIENT_STATUS } from '../constants/clientStatus';
import { MONTHS } from '../constants/months';

export type FilterValue = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

const STATUS_FILTERS: { v: FilterValue; l: string }[] = [
  { v: CLIENT_STATUS.ALL, l: 'Todos' },
  { v: CLIENT_STATUS.ACTIVE, l: 'Activos' },
  { v: CLIENT_STATUS.EXPIRING, l: 'Por vencer' },
  { v: CLIENT_STATUS.PAUSED, l: 'Pausados' },
  { v: CLIENT_STATUS.ENDED, l: 'Finalizados' },
];

interface Props {
  q: string;
  onQChange: (value: string) => void;
  birthMonth: string;
  onBirthMonthChange: (value: string) => void;
  filter: FilterValue;
  onFilterChange: (value: FilterValue) => void;
  resultsLabel: string;
  isFetching: boolean;
}

export function ClientFilterBar({
  q,
  onQChange,
  birthMonth,
  onBirthMonthChange,
  filter,
  onFilterChange,
  resultsLabel,
  isFetching,
}: Props) {
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);

  const activeCount = (filter !== CLIENT_STATUS.ALL ? 1 : 0) + (birthMonth !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 mb-3.5">
      {/* Row 1: type-to-search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <input
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              placeholder="Buscar cliente…"
              className="w-full pl-[38px] pr-3 py-2.5 text-[13.5px] border border-rule rounded-[9px] bg-paper placeholder:text-faint focus:outline-none focus:border-olive-600"
            />
            <Icon
              name="search"
              size={16}
              className="absolute left-[13px] top-1/2 -translate-y-1/2 text-faint"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowSecondaryFilters((v) => !v)}
            aria-label="Filtros"
            className={`lg:hidden relative shrink-0 flex items-center gap-1.5 px-3 h-[38px] border rounded-[9px] text-[12px] font-medium transition-colors ${
              activeCount > 0
                ? 'border-olive-600 bg-olive-50 text-olive-800'
                : 'border-rule bg-paper text-muted'
            }`}
          >
            <Icon name="filter" size={12} />
            Filtros
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-olive-800 text-white text-[10px] flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Month — collapsed on mobile behind toggle */}
        <div className={`${showSecondaryFilters ? 'block' : 'hidden'} lg:block lg:shrink-0`}>
          <div className="relative">
            <select
              value={birthMonth}
              onChange={(e) => onBirthMonthChange(e.target.value)}
              className="appearance-none font-mono text-[13px] text-ink-2 w-full py-[10px] pl-[14px] pr-8 border border-rule rounded-[9px] bg-paper cursor-pointer"
            >
              <option value="all">Mes · todos</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <Icon
              name="chevron-down"
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Results count — always visible */}
        <span
          className={`font-mono text-[11.5px] uppercase tracking-[.04em] lg:ml-auto transition-opacity ${isFetching ? 'opacity-40' : 'text-muted'}`}
        >
          {resultsLabel}
        </span>
      </div>

      {/* Status segmented control — collapsed on mobile behind toggle */}
      <div className={`${showSecondaryFilters ? 'flex' : 'hidden'} lg:flex`}>
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
          <div className="inline-flex p-[3px] gap-px bg-paper border border-rule rounded-[11px] text-[12.5px]">
            {STATUS_FILTERS.map(({ v, l }) => (
              <button
                type="button"
                key={v}
                onClick={() => onFilterChange(v)}
                className={`px-3.5 py-[6px] rounded-[8px] font-semibold whitespace-nowrap transition-all ${
                  filter === v
                    ? 'bg-olive-100 text-olive-700'
                    : 'text-muted font-normal hover:bg-cream-2 hover:text-ink-2'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
