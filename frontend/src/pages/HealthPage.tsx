import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { useHealth, type HealthReport, type ServiceCheck } from '@/features/health/hooks/useHealth';
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

const SERVICE_STATUS: Record<
  ServiceCheck['status'],
  { label: string; text: string; bg: string; dot: string }
> = {
  ok: { label: 'Operativo', text: 'text-ok', bg: 'bg-ok-bg', dot: 'bg-ok' },
  down: { label: 'Caído', text: 'text-danger', bg: 'bg-danger-bg', dot: 'bg-danger' },
};

const SERVICE_ICONS: Record<string, string> = {
  'API La Oliva': 'server',
  'Base de datos': 'database',
};

const formatUptime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export function HealthPage() {
  const { report, isLoading, isFetching, refresh } = useHealth();

  const api = report?.services.find((s) => s.name === 'API La Oliva');
  const database = report?.services.find((s) => s.name === 'Base de datos');
  const banner = report ? BANNER_STYLES[report.status] : null;

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader
        label="Estado del sistema"
        title="Health"
        action={
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center gap-[9px] bg-paper text-olive-700 border border-olive-200 rounded-[9px] px-[18px] py-[11px] text-[13.5px] font-semibold hover:bg-olive-100 transition-colors"
          >
            <Icon
              name="refresh"
              size={16}
              stroke={1.8}
              className={isFetching ? 'animate-spin' : ''}
            />
            Probar conexión
          </button>
        }
      />

      {isLoading || !report || !banner ? (
        <div className="flex items-center gap-4 p-4 rounded-lg border border-rule bg-paper">
          <Icon name="refresh" size={20} className="text-muted animate-spin" />
          <span className="text-muted text-sm">Verificando...</span>
        </div>
      ) : (
        <>
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
                {formatDateTime(report.checkedAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">
            <div className="bg-paper border border-rule rounded-[14px] px-5 py-[18px]">
              <p className="font-mono text-[10px] tracking-[.1em] text-faint uppercase mb-[11px]">
                API
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
                  {api?.latencyMs ?? '—'}
                </span>
                <span className="font-mono text-[11px] text-faint">ms</span>
              </p>
            </div>
            <div className="bg-paper border border-rule rounded-[14px] px-5 py-[18px]">
              <p className="font-mono text-[10px] tracking-[.1em] text-faint uppercase mb-[11px]">
                Base de datos
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
                  {database?.latencyMs ?? '—'}
                </span>
                <span className="font-mono text-[11px] text-faint">ms</span>
              </p>
            </div>
            <div className="bg-paper border border-rule rounded-[14px] px-5 py-[18px]">
              <p className="font-mono text-[10px] tracking-[.1em] text-faint uppercase mb-[11px]">
                Memoria
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
                  {report.process.memoryUsedMb}
                </span>
                <span className="font-mono text-[11px] text-faint">MB</span>
              </p>
            </div>
            <div className="bg-paper border border-rule rounded-[14px] px-5 py-[18px]">
              <p className="font-mono text-[10px] tracking-[.1em] text-faint uppercase mb-[11px]">
                Tiempo activo
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="font-serif font-semibold text-[30px] leading-none text-ink tabular-nums">
                  {formatUptime(report.process.uptimeSeconds)}
                </span>
              </p>
            </div>
          </div>

          <h2 className="font-serif font-semibold text-[24px] text-ink mb-4">
            Servicios y endpoints
          </h2>
          <div className="bg-paper border border-rule rounded-[14px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-olive-50">
                  <th className="text-left px-[24px] py-[13px] text-[10px] font-mono font-semibold uppercase tracking-[.13em] text-muted border-b border-rule">
                    Servicio
                  </th>
                  <th className="text-left px-[24px] py-[13px] text-[10px] font-mono font-semibold uppercase tracking-[.13em] text-muted border-b border-rule">
                    Latencia
                  </th>
                  <th className="text-right px-[24px] py-[13px] text-[10px] font-mono font-semibold uppercase tracking-[.13em] text-muted border-b border-rule">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.services.map((service) => {
                  const st = SERVICE_STATUS[service.status];
                  return (
                    <tr
                      key={service.name}
                      className="border-b border-cream-2 last:border-0 hover:bg-row-hover transition-colors"
                    >
                      <td className="px-[24px] py-[14px]">
                        <div className="flex items-center gap-[11px]">
                          <span className="w-[30px] h-[30px] rounded-[8px] bg-cream-2 text-muted flex items-center justify-center shrink-0">
                            <Icon
                              name={SERVICE_ICONS[service.name] ?? 'server'}
                              size={15}
                              stroke={1.7}
                            />
                          </span>
                          <span className="text-[14px] font-semibold text-ink">{service.name}</span>
                        </div>
                      </td>
                      <td className="px-[24px] py-[14px] font-mono text-[12.5px] text-ink-2 tabular-nums">
                        {service.latencyMs} ms
                      </td>
                      <td className="px-[24px] py-[14px] text-right">
                        <span
                          className={`inline-flex items-center gap-[7px] pl-[9px] pr-[11px] py-[4px] rounded-full text-[12.5px] font-semibold ${st.text} ${st.bg}`}
                        >
                          <span className={`w-[7px] h-[7px] rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
