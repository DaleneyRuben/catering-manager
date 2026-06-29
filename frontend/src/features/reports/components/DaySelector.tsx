export type DayOption = 'today' | 'tomorrow';

interface Props {
  selected: DayOption;
  onSelect: (opt: DayOption) => void;
  dateLabel: (opt: DayOption) => string;
}

const OPTIONS: DayOption[] = ['today', 'tomorrow'];

export function DaySelector({ selected, onSelect, dateLabel }: Props) {
  return (
    <div className="flex gap-2 mb-[18px]">
      {OPTIONS.map((opt) => {
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={[
              'flex-1 text-center py-[9px] text-[12.5px] rounded-[8px] border-[1.5px] transition-colors',
              isSelected
                ? 'bg-olive-100 text-olive-700 border-olive-200 font-semibold'
                : 'bg-white text-muted border-rule',
            ].join(' ')}
          >
            {opt === 'today' ? 'Hoy' : 'Mañana'}{' '}
            <span className="opacity-60">({dateLabel(opt)})</span>
          </button>
        );
      })}
    </div>
  );
}
