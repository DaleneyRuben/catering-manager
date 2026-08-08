import { Icon } from '@ui/Icon';
import { formatDayLabel, formatMoney, formatMonthLabel } from '@/features/finance/utils/format';

interface Props {
  income: number;
  expenses: number;
  balance: number;
  month: string;
  incomeCount: number;
  expenseCount: number;
  // Set only while the month on screen is still running: the balance is a running total, so it
  // states how far it counts. Left undefined on a closed month, where the total is final.
  asOf?: string;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function Tile({
  icon,
  iconCls,
  label,
  value,
  caption,
}: {
  icon: string;
  iconCls: string;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="bg-paper border border-rule rounded-[13px] px-[22px] py-5">
      <div className="flex items-center gap-[9px] mb-3.5">
        <span
          className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}
        >
          <Icon name={icon} size={15} stroke={2} />
        </span>
        <span className="font-mono text-[10px] tracking-[.14em] uppercase text-muted font-semibold">
          {label}
        </span>
      </div>
      <div className="font-serif font-semibold text-[44px] leading-[.9] text-ink">{value}</div>
      <div className="font-mono text-[10.5px] text-faint mt-[9px]">{caption}</div>
    </div>
  );
}

export function FinanceTiles({
  income,
  expenses,
  balance,
  month,
  incomeCount,
  expenseCount,
  asOf,
}: Props) {
  const up = balance >= 0;

  return (
    <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 max-lg:grid-cols-1">
      <Tile
        icon="arrow-up"
        iconCls="bg-olive-100 text-olive-700"
        label="Ingresos"
        value={formatMoney(income)}
        caption={plural(incomeCount, 'pago', 'pagos')}
      />
      <Tile
        icon="arrow-down"
        iconCls="bg-expense-icon-bg text-danger"
        label="Egresos"
        value={formatMoney(expenses)}
        caption={plural(expenseCount, 'gasto', 'gastos')}
      />

      <div
        className={`border rounded-[13px] px-[26px] py-5 flex items-center justify-between gap-5 ${
          up
            ? 'bg-balance-up-bg border-balance-up-border'
            : 'bg-balance-down-bg border-balance-down-border'
        }`}
      >
        <div>
          <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted font-semibold mb-3">
            Balance
          </div>
          <div
            className={`font-serif font-semibold text-[66px] leading-[.85] tracking-[-.01em] ${
              up ? 'text-olive-700' : 'text-danger'
            }`}
          >
            {/* Minus sign U+2212, not a hyphen: it aligns with the digits at this size. */}
            {up ? '+' : '−'}
            {formatMoney(balance)}
          </div>
        </div>
        <div className="font-mono text-[10.5px] leading-[1.7] text-muted text-right">
          <div>{formatMonthLabel(month)}</div>
          <div className="text-faint">{incomeCount + expenseCount} movimientos</div>
          {asOf && <div className="text-open-month-text mt-1">Al {formatDayLabel(asOf)}</div>}
        </div>
      </div>
    </div>
  );
}
