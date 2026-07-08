import { Card } from '@ui/Card';
import { Label } from '@ui/Label';
import type {
  DeliveryCalendarCell,
  DeliveryCalendarMonth,
  DeliveryDayStatus,
} from '@/features/clients/utils/deliveryCalendar';

const WEEKDAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];

const CELL_STYLE: Record<DeliveryDayStatus, React.CSSProperties> = {
  delivered: {
    background: 'var(--color-calendar-delivered-bg)',
    color: 'var(--color-calendar-delivered-text)',
    fontWeight: 600,
  },
  suspended: {
    background: 'var(--color-calendar-suspended-bg)',
    color: 'var(--color-calendar-suspended-text)',
    border: '1.5px solid var(--color-calendar-suspended-border)',
    fontWeight: 600,
  },
  pending: {
    background: '#ffffff',
    color: 'var(--color-faint)',
    border: '1.5px dashed var(--color-calendar-pending-border)',
  },
  out: {
    background: 'var(--color-calendar-out-bg)',
    color: 'var(--color-calendar-out-text)',
    opacity: 0.55,
  },
};

function DeliveryDayCell({ cell }: { cell: DeliveryCalendarCell | null }) {
  if (!cell) return <div className="h-[38px]" />;
  return (
    <div
      data-testid="delivery-day-cell"
      data-status={cell.status}
      className="h-[38px] flex items-center justify-center rounded-[8px] font-mono text-[12px]"
      style={CELL_STYLE[cell.status]}
    >
      {cell.date.slice(-2)}
    </div>
  );
}

interface Props {
  rangeLabel: string;
  months: DeliveryCalendarMonth[];
  deliveredCount: number;
  suspendedCount: number;
  showPendingLegend: boolean;
}

export function DeliveryCalendarCard({
  rangeLabel,
  months,
  deliveredCount,
  suspendedCount,
  showPendingLegend,
}: Props) {
  return (
    <Card padding="24px 26px">
      <div className="flex items-start justify-between gap-3.5 flex-wrap mb-4">
        <div>
          <Label variant="section" className="mb-1.5">
            Calendario de entregas
          </Label>
          <p className="font-mono text-[11.5px] text-faint tabular-nums">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-3.5 flex-wrap text-[11.5px] text-muted">
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded shrink-0"
              style={{ background: 'var(--color-calendar-delivered-bg)' }}
            />
            Entregado
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded shrink-0"
              style={{
                background: 'var(--color-calendar-suspended-bg)',
                border: '1px solid var(--color-calendar-suspended-border)',
              }}
            />
            Suspendido
          </span>
          {showPendingLegend && (
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded shrink-0"
                style={{ border: '1.5px dashed var(--color-calendar-pending-border)' }}
              />
              Pendiente
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-[26px] mb-5 pb-[18px] border-b border-cream-2">
        <div>
          <p className="font-serif text-[30px] font-semibold leading-none text-olive-700">
            {deliveredCount}
          </p>
          <p className="text-[11.5px] text-faint mt-1">entregas realizadas</p>
        </div>
        <div>
          <p className="font-serif text-[30px] font-semibold leading-none text-danger">
            {suspendedCount}
          </p>
          <p className="text-[11.5px] text-faint mt-1">días suspendidos</p>
        </div>
      </div>

      <div
        className="grid gap-[22px]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}
      >
        {months.map((month) => (
          <div key={month.label}>
            <p className="font-mono text-[12px] font-semibold text-ink tracking-[.03em] mb-[11px]">
              {month.label}
            </p>
            <div className="grid grid-cols-5 gap-[5px] mb-1.5">
              {WEEKDAY_LABELS.map((label) => (
                <span
                  key={label}
                  className="text-center font-mono text-[9px] tracking-[.06em] text-muted-dot"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-[5px]">
              {month.weeks.map((week, weekIndex) => (
                // eslint-disable-next-line react/no-array-index-key -- weeks have no stable id, position is fixed
                <div key={weekIndex} className="grid grid-cols-5 gap-[5px]">
                  {week.map((cell, dayIndex) => (
                    <DeliveryDayCell key={cell?.date ?? `pad-${dayIndex}`} cell={cell} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
