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

const EVENT_CLASSES: Record<HistoryEventType, string> = {
  paused: 'bg-warn-bg text-warn',
  resumed: 'bg-ok-bg text-ok',
  plan_assigned: 'bg-olive-100 text-ink',
  plan_changed: 'bg-olive-100 text-ink',
  suspended: 'bg-warn-bg text-warn',
  reactivated: 'bg-ok-bg text-ok',
  finalized: 'bg-rule text-muted',
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
    <div className="bg-paper border border-rule rounded-lg divide-y divide-rule">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-center gap-4 px-5 py-4">
          <p className="font-mono text-[12px] text-muted shrink-0 w-32">
            {formatDateTime(entry.occurredAt)}
          </p>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono ${EVENT_CLASSES[entry.eventType]}`}
          >
            {EVENT_LABELS[entry.eventType]}
          </span>
        </div>
      ))}
    </div>
  );
}
