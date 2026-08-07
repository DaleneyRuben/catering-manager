import { IconButton } from '@ui/IconButton';
import { formatMonthLabel, shiftMonth } from '@/features/finance/utils/format';

interface Props {
  month: string;
  // Both bounds are server-owned: the register has no history before it went live, and no month
  // ahead of today has moved any money yet.
  earliestMonth: string;
  currentMonth: string;
  onChange: (month: string) => void;
}

const arrowCls = (disabled: boolean) =>
  `p-1.5 rounded-[7px] ${
    disabled ? 'text-rule-2 cursor-default' : 'text-ink-2 hover:bg-olive-50 cursor-pointer'
  }`;

export function MonthSelector({ month, earliestMonth, currentMonth, onChange }: Props) {
  const atStart = month <= earliestMonth;
  const atEnd = month >= currentMonth;

  return (
    <div className="flex items-center gap-1 bg-paper border border-rule rounded-[10px] px-1.5 py-[5px]">
      <IconButton
        icon="chevron-left"
        label="Mes anterior"
        size={17}
        stroke={2}
        disabled={atStart}
        title={
          atStart
            ? `El registro empieza en ${formatMonthLabel(earliestMonth).toLowerCase()}`
            : 'Mes anterior'
        }
        onClick={() => onChange(shiftMonth(month, -1))}
        className={arrowCls(atStart)}
      />
      <div className="min-w-[150px] text-center text-[14px] font-semibold text-ink px-1">
        {formatMonthLabel(month)}
      </div>
      <IconButton
        icon="chevron-right"
        label="Mes siguiente"
        size={17}
        stroke={2}
        disabled={atEnd}
        onClick={() => onChange(shiftMonth(month, 1))}
        className={arrowCls(atEnd)}
      />
    </div>
  );
}
