import { Icon } from '@ui/Icon';
import type { HealthReport } from '@/features/health/types';
import { formatDateTime } from '@/utils/format';

const BANNER_STYLES: Record<
  HealthReport['status'],
  {
    title: string;
    desc: string;
    icon: string;
    bg: string;
    border: string;
    dotBg: string;
    halo: string;
    sub: string;
  }
> = {
  ok: {
    title: 'Todos los sistemas operativos',
    desc: 'La API y los servicios conectados responden con normalidad.',
    icon: 'check',
    bg: 'bg-success-soft-bg',
    border: 'border-olive-200',
    dotBg: 'bg-ok',
    halo: 'shadow-[var(--shadow-halo-ok)]',
    sub: 'text-success-text',
  },
  degraded: {
    title: 'Servicios degradados',
    desc: 'Algunos servicios responden con latencia elevada.',
    icon: 'alert',
    bg: 'bg-warn-bg',
    border: 'border-warn-border',
    dotBg: 'bg-warn',
    halo: 'shadow-[var(--shadow-halo-warn)]',
    sub: 'text-warn',
  },
  down: {
    title: 'Servicios caídos',
    desc: 'No se pudo conectar a la base de datos.',
    icon: 'x',
    bg: 'bg-danger-bg',
    border: 'border-danger-border',
    dotBg: 'bg-danger',
    halo: 'shadow-[var(--shadow-halo-danger)]',
    sub: 'text-danger',
  },
};

interface Props {
  status: HealthReport['status'];
  checkedAt: string;
}

export function HealthStatusBanner({ status, checkedAt }: Props) {
  const banner = BANNER_STYLES[status];

  return (
    <div
      className={`rounded-[14px] p-[22px] flex items-center gap-[18px] mb-5 ${banner.bg} border ${banner.border}`}
    >
      <span
        className={`w-[46px] h-[46px] rounded-full text-white flex items-center justify-center shrink-0 ${banner.dotBg} ${banner.halo}`}
      >
        <Icon name={banner.icon} size={24} stroke={2.4} />
      </span>
      <div className="flex-1">
        <p className="font-serif font-semibold text-[25px] leading-[1.05] text-ink">
          {banner.title}
        </p>
        <p className={`text-[13.5px] mt-1 ${banner.sub}`}>{banner.desc}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[10.5px] tracking-[.06em] text-faint uppercase">
          Última comprobación
        </p>
        <p className="font-mono text-[14px] font-semibold text-ink mt-[3px]">
          {formatDateTime(checkedAt)}
        </p>
      </div>
    </div>
  );
}
