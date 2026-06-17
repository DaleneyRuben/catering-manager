import { useClientHistory } from '../../hooks/useClientHistory';
import { formatDate, formatDateTime } from '../../utils/format';
import { EVENT_LABELS } from '../../constants/historyEvents';

interface Props {
  clientId: string;
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
        {history.map((entry, i) => {
          const meta = entry.metadata;
          const planName = typeof meta?.planName === 'string' ? meta.planName : null;
          const planPrice = typeof meta?.planPrice === 'number' ? meta.planPrice : null;
          const discount = typeof meta?.discount === 'number' ? meta.discount : 0;
          const showPlanDetails =
            (entry.eventType === 'plan_assigned' ||
              entry.eventType === 'plan_renewed' ||
              entry.eventType === 'plan_changed' ||
              entry.eventType === 'reactivated') &&
            planName;

          const suspendedDates = Array.isArray(meta?.dates) ? (meta.dates as string[]) : null;

          return (
            <div key={entry.id} className="relative">
              <div
                className={`absolute -left-[18px] top-[5px] w-[11px] h-[11px] rounded-full border ${
                  i === 0 ? 'bg-olive-800 border-olive-800' : 'bg-paper border-rule'
                }`}
              />
              <p className="font-mono text-[10.5px] text-muted">
                {formatDateTime(entry.occurredAt)}
              </p>
              <p className="text-[13px] font-semibold text-ink">{EVENT_LABELS[entry.eventType]}</p>
              {showPlanDetails && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-olive-800 text-white">
                    {planName}
                  </span>
                  {planPrice !== null && (
                    <span className="font-mono text-[11px] text-muted">
                      ${(planPrice - discount).toLocaleString()}/mes
                    </span>
                  )}
                </div>
              )}
              {suspendedDates && suspendedDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[...suspendedDates].sort().map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                      style={{ background: '#f3eedc', color: '#6b4f08' }}
                    >
                      {formatDate(d)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
