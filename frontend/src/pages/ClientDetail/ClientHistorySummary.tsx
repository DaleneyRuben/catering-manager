import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  eventCount: number;
  planName: string | null;
  clientSince: string | null;
}

function formatMonthYear(iso: string) {
  const label = format(parseISO(iso), 'MMM yyyy', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function ClientHistorySummary({ eventCount, planName, clientSince }: Props) {
  return (
    <div className="px-0.5 py-1.5">
      <p className="text-[10.5px] font-mono uppercase tracking-[.16em] text-olive-600 font-semibold mb-3">
        Registro
      </p>
      <h2 className="font-serif text-[30px] font-semibold leading-[1.05] text-ink mb-3">
        Historial de actividad
      </h2>
      <p className="text-[13.5px] leading-[1.55] text-muted mb-6">
        Cada cambio de plan, renovación y suspensión queda registrado en orden cronológico.
      </p>
      <div className="flex flex-col border-t border-hairline">
        <div className="flex items-center justify-between py-3 border-b border-cream-2">
          <span className="text-[13px] text-muted">Eventos registrados</span>
          <span className="font-mono text-[14px] font-semibold text-ink">{eventCount}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-cream-2">
          <span className="text-[13px] text-muted">Plan actual</span>
          <span className="font-mono text-[12.5px] font-semibold text-olive-700">
            {planName ?? '—'}
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-[13px] text-muted">Cliente desde</span>
          <span className="font-mono text-[12.5px] font-semibold text-ink">
            {clientSince ? formatMonthYear(clientSince) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
