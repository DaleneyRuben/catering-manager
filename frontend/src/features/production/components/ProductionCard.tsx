import { Icon } from '@ui/Icon';
import { formatLongDate } from '@/utils/format';
import type { ProductionSummary } from '@/features/production/types';
import { ProductionColumn } from './ProductionColumn';

interface Props {
  summary: ProductionSummary;
}

const WEEKEND_MESSAGE =
  'Los sábados y domingos no hay entregas. La producción se planifica de domingo a jueves para las entregas de lunes a viernes — volvé el domingo para preparar el lunes.';

const COLUMNS: { label: string; key: keyof ProductionSummary['groups'] }[] = [
  { label: 'Jugo', key: 'juice' },
  { label: 'Almuerzo', key: 'lunchOnly' },
  { label: 'Almuerzo y cena', key: 'lunchAndDinner' },
  { label: 'Completo', key: 'full' },
];

export function ProductionCard({ summary }: Props) {
  const { date, isDeliveryDay, total, groups } = summary;

  const subtitle = isDeliveryDay
    ? `${total} ${total === 1 ? 'cliente a preparar' : 'clientes a preparar'}`
    : '—';

  return (
    <div className="bg-paper border border-rule rounded-[14px] px-7 py-6">
      <div className="flex items-start justify-between gap-5 flex-wrap mb-[22px]">
        <div>
          <h2 className="font-serif font-semibold text-[26px] leading-none text-ink m-0">
            Clientes de mañana
          </h2>
          <p className="font-mono text-[11px] tracking-[.06em] text-faint mt-[9px] uppercase">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-[9px] font-mono text-[12px] text-ink-2 bg-day-badge-bg border border-day-badge-border rounded-[9px] px-3.5 py-[9px] whitespace-nowrap">
          <span className="text-olive-600">
            <Icon name="calendar" size={15} stroke={1.7} />
          </span>
          <span className="text-muted">Mañana</span>
          <span className="font-semibold">{formatLongDate(date)}</span>
        </div>
      </div>

      {isDeliveryDay ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(188px,1fr))] gap-5 max-md:grid-cols-1">
          {COLUMNS.map(({ label, key }) => (
            <ProductionColumn key={key} label={label} names={groups[key]} />
          ))}
        </div>
      ) : (
        <div className="pt-[52px] pb-[46px] px-6 text-center flex flex-col items-center gap-[15px]">
          <span className="w-14 h-14 rounded-[15px] bg-cream-2 text-empty-italic flex items-center justify-center">
            <Icon name="calendar-x" size={27} stroke={1.5} />
          </span>
          <p className="font-serif font-semibold text-[24px] text-ink-2 leading-[1.1] m-0">
            No hay entregas mañana
          </p>
          <p className="text-[13.5px] text-faint max-w-[360px] leading-[1.55] m-0">
            {WEEKEND_MESSAGE}
          </p>
        </div>
      )}
    </div>
  );
}
