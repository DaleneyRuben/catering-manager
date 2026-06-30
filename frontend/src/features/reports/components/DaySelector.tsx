import { Button } from '@ui/Button';

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
          <Button
            key={opt}
            variant="bare"
            onClick={() => onSelect(opt)}
            className={[
              'flex-1 border-[1.5px] transition-colors',
              isSelected
                ? 'font-semibold bg-olive-100 text-olive-700 border-olive-200'
                : 'bg-white text-muted border-rule',
            ].join(' ')}
            style={{
              padding: '9px',
              fontSize: '12.5px',
              borderRadius: '8px',
              lineHeight: 'normal',
            }}
          >
            {opt === 'today' ? 'Hoy' : 'Mañana'}{' '}
            <span className="opacity-60">({dateLabel(opt)})</span>
          </Button>
        );
      })}
    </div>
  );
}
