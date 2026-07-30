import { Button } from '@ui/Button';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { DatePickerInput } from '@ui/DatePickerInput';

export type HistoryStatusValue = 'all' | 'pagado' | 'no_pagado';

const STATUS_FILTERS: { v: HistoryStatusValue; l: string }[] = [
  { v: 'all', l: 'Todos' },
  { v: 'pagado', l: 'Pagado' },
  { v: 'no_pagado', l: 'No pagado' },
];

interface Props {
  q: string;
  onQChange: (value: string) => void;
  status: HistoryStatusValue;
  onStatusChange: (value: HistoryStatusValue) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  resultsLabel: string;
  isFetching: boolean;
}

const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') e.currentTarget.blur();
};

export function EvaluationHistoryFilterBar({
  q,
  onQChange,
  status,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  resultsLabel,
  isFetching,
}: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap mb-3.5">
      {/* Name / phone search */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          onKeyDown={blurOnEnter}
          placeholder="Buscar por nombre o teléfono…"
          className="w-full pl-[38px] pr-9 py-2.5 text-[13.5px] border border-rule rounded-[9px] bg-paper placeholder:text-faint focus:outline-none focus:border-olive-600"
        />
        <Icon
          name="search"
          size={16}
          className="absolute left-[13px] top-1/2 -translate-y-1/2 text-faint"
        />
        {q && (
          <IconButton
            icon="x"
            label="Limpiar búsqueda"
            onClick={() => onQChange('')}
            size={12}
            stroke={2.2}
            className="absolute right-[9px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cream-2 text-muted hover:bg-olive-100 hover:text-olive-700"
          />
        )}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- false positive: htmlFor/id are correctly matched below, rule can't see across the DatePickerInput component boundary */}
        <label htmlFor="historyDateFrom" className="font-mono text-[11px] text-faint uppercase">
          Desde
        </label>
        <div className="w-[130px]">
          <DatePickerInput id="historyDateFrom" value={dateFrom} onChange={onDateFromChange} />
        </div>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- false positive: htmlFor/id are correctly matched below, rule can't see across the DatePickerInput component boundary */}
        <label htmlFor="historyDateTo" className="font-mono text-[11px] text-faint uppercase">
          Hasta
        </label>
        <div className="w-[130px]">
          <DatePickerInput id="historyDateTo" value={dateTo} onChange={onDateToChange} />
        </div>
      </div>

      {/* Status segmented control */}
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
        <div className="inline-flex p-[3px] gap-px bg-paper border border-rule rounded-[11px] text-[12.5px]">
          {STATUS_FILTERS.map(({ v, l }) => (
            <Button
              key={v}
              variant="bare"
              onClick={() => onStatusChange(v)}
              className={`font-semibold whitespace-nowrap transition-all ${
                status === v
                  ? 'bg-olive-100 text-olive-700'
                  : 'text-muted hover:bg-cream-2 hover:text-ink-2'
              }`}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                borderRadius: '8px',
                lineHeight: 'normal',
              }}
            >
              {l}
            </Button>
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
