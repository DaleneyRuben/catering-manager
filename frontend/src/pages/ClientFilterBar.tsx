import { Icon } from '../components/ui/Icon';
import { CLIENT_STATUS } from '../constants/clientStatus';

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
  restriction: string;
  onRestrictionChange: (value: string) => void;
  filter: FilterValue;
  onFilterChange: (value: FilterValue) => void;
  resultsLabel: string;
  isFetching: boolean;
}

const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') e.currentTarget.blur();
};

export function ClientFilterBar({
  q,
  onQChange,
  restriction,
  onRestrictionChange,
  filter,
  onFilterChange,
  resultsLabel,
  isFetching,
}: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap mb-3.5">
      {/* Name search */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          onKeyDown={blurOnEnter}
          placeholder="Buscar cliente…"
          className="w-full pl-[38px] pr-9 py-2.5 text-[13.5px] border border-rule rounded-[9px] bg-paper placeholder:text-faint focus:outline-none focus:border-olive-600"
        />
        <Icon
          name="search"
          size={16}
          className="absolute left-[13px] top-1/2 -translate-y-1/2 text-faint"
        />
        {q && (
          <button
            type="button"
            aria-label="Limpiar búsqueda de cliente"
            onClick={() => onQChange('')}
            className="absolute right-[9px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cream-2 text-muted flex items-center justify-center hover:bg-olive-100 hover:text-olive-700 transition-colors"
          >
            <Icon name="x" size={12} stroke={2.2} />
          </button>
        )}
      </div>

      {/* Allergy / restriction search */}
      <div className="relative flex-1 min-w-[230px]">
        <input
          value={restriction}
          onChange={(e) => onRestrictionChange(e.target.value)}
          onKeyDown={blurOnEnter}
          placeholder="Buscar por alergia o restricción…"
          className="w-full pl-[38px] pr-9 py-2.5 text-[13.5px] border border-rule rounded-[9px] bg-paper placeholder:text-faint focus:outline-none focus:border-warn-dot"
        />
        <Icon
          name="alert"
          size={16}
          className="absolute left-[13px] top-1/2 -translate-y-1/2 text-warn-dot"
        />
        {restriction && (
          <button
            type="button"
            aria-label="Limpiar búsqueda de alergia"
            onClick={() => onRestrictionChange('')}
            className="absolute right-[9px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cream-2 text-muted flex items-center justify-center hover:bg-warn-border hover:text-ink-2 transition-colors"
          >
            <Icon name="x" size={12} stroke={2.2} />
          </button>
        )}
      </div>

      {/* Status segmented control */}
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

      {/* Results count */}
      <span
        className={`font-mono text-[11.5px] uppercase tracking-[.04em] ml-auto transition-opacity ${isFetching ? 'opacity-40' : 'text-muted'}`}
      >
        {resultsLabel}
      </span>
    </div>
  );
}
