import { Icon } from '@/components/ui/Icon';
import { formatShortDate } from '@/utils/format';
import type { MenuStatus } from '@/features/dashboard/types';

interface RowProps {
  prefix: string;
  status: MenuStatus;
}

function MenuRow({ prefix, status }: RowProps) {
  const { loaded } = status;
  return (
    <div
      className={`flex items-center gap-[11px] px-[13px] py-[11px] rounded-[9px] border ${
        loaded
          ? 'bg-menu-loaded border-menu-loaded-border'
          : 'bg-menu-empty border-menu-empty-border'
      }`}
    >
      <span
        className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 ${
          loaded ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'
        }`}
      >
        {loaded ? (
          <span className="text-[14px] font-bold leading-none">✓</span>
        ) : (
          <span className="font-serif text-[16px] font-bold leading-none">!</span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-ink leading-tight">
          {prefix} · {formatShortDate(status.date)}
        </p>
        <p className="font-mono text-[10px] text-faint mt-0.5">
          {loaded ? 'Menú cargado' : 'Pendiente de cargar'}
        </p>
      </div>
      <span
        className={`text-[11px] font-semibold rounded-full px-[11px] py-[3px] whitespace-nowrap ${
          loaded ? 'text-ok bg-ok-bg' : 'text-warn bg-warn-bg'
        }`}
      >
        {loaded ? 'Cargado' : 'Vacío'}
      </span>
    </div>
  );
}

interface Props {
  today: MenuStatus;
  tomorrow: MenuStatus;
  todayLabel?: string;
  tomorrowLabel?: string;
}

export function MenuStatusCard({
  today,
  tomorrow,
  todayLabel = 'Hoy',
  tomorrowLabel = 'Mañana',
}: Props) {
  return (
    <div className="bg-paper border border-rule rounded-[14px] px-6 py-[22px]">
      <div className="flex items-center gap-[11px] mb-[16px]">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="dome" size={17} stroke={1.6} />
        </span>
        <h2 className="font-serif font-semibold text-[20px] text-ink m-0">Menú del día</h2>
      </div>
      <div className="flex flex-col gap-[10px]">
        <MenuRow prefix={todayLabel} status={today} />
        <MenuRow prefix={tomorrowLabel} status={tomorrow} />
      </div>
    </div>
  );
}
