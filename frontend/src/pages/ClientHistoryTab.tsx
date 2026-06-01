import { useClientHistory } from '../hooks/useClientHistory';
import { formatDateTime } from '../utils/format';
import type { HistoryEventType } from '../types/client';

const EVENT_LABELS: Record<HistoryEventType, string> = {
  paused: 'Plan pausado',
  resumed: 'Plan reanudado',
  plan_assigned: 'Plan asignado',
  plan_changed: 'Plan modificado',
  suspended: 'Días suspendidos',
  reactivated: 'Cliente reactivado',
  finalized: 'Plan finalizado',
};

interface Props {
  clientId: number;
}

export function ClientHistoryTab({ clientId }: Props) {
  const { history, isLoading } = useClientHistory(clientId);

  if (isLoading) {
    return (
      <div className="bg-paper border border-rule rounded-lg p-10 text-center">
        <p className="font-mono text-[13px] text-muted">Cargando historial…</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-paper border border-rule rounded-lg p-10 text-center">
        <p className="font-mono text-[13px] text-muted">Sin eventos en el historial.</p>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-rule rounded-lg p-5">
      <div className="relative flex flex-col gap-3.5 pl-[18px]">
        <div className="absolute left-[5px] top-[6px] bottom-[6px] w-px bg-rule" />
        {history.map((entry, i) => (
          <div key={entry.id} className="relative">
            <div
              className={`absolute -left-[18px] top-[5px] w-[11px] h-[11px] rounded-full border ${
                i === 0 ? 'bg-olive-800 border-olive-800' : 'bg-paper border-rule'
              }`}
            />
            <p className="font-mono text-[10.5px] text-muted">{formatDateTime(entry.occurredAt)}</p>
            <p className="text-[13px] font-semibold text-ink">{EVENT_LABELS[entry.eventType]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
