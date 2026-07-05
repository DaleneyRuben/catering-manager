import { Icon } from '@ui/Icon';
import type { ServiceCheck } from '@/features/health/types';

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

interface Props {
  services: ServiceCheck[];
}

export function HealthServicesTable({ services }: Props) {
  return (
    <>
      <h2 className="font-serif font-semibold text-[24px] text-ink mb-4">Servicios y endpoints</h2>
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
            {services.map((service) => {
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
  );
}
