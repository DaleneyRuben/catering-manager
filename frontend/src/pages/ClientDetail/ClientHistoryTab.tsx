import { format, parseISO } from 'date-fns';
import { useClientHistory } from '../../hooks/useClientHistory';
import { formatDate } from '../../utils/format';
import { EVENT_LABELS } from '../../constants/historyEvents';
import { Card } from '../../components/ui/Card';
import { ClientHistorySummary } from './ClientHistorySummary';

function formatEventDateTime(iso: string) {
  return `${formatDate(iso)} · ${format(parseISO(iso), 'HH:mm')}`;
}

interface Props {
  clientId: string;
  currentPlanName?: string | null;
}

export function ClientHistoryTab({ clientId, currentPlanName = null }: Props) {
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

  const clientSince = history.reduce(
    (earliest, entry) => (entry.occurredAt < earliest ? entry.occurredAt : earliest),
    history[0].occurredAt,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-[28px]">
      <div>
        <ClientHistorySummary
          eventCount={history.length}
          planName={currentPlanName}
          clientSince={clientSince}
        />
      </div>
      <Card padding="26px 28px">
        <div className="relative flex flex-col gap-[22px] pl-[18px]">
          <div className="absolute left-[5px] top-[6px] bottom-[6px] w-px bg-rule" />
          {history.map((entry, i) => {
            const meta = entry.metadata;
            const planName = typeof meta?.planName === 'string' ? meta.planName : null;
            const planPrice = meta?.planPrice !== null ? parseFloat(String(meta.planPrice)) : null;
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
                  className={`absolute -left-[18px] top-[4px] w-[12px] h-[12px] rounded-full border-2 ${
                    i === 0 ? 'bg-olive-800 border-olive-800' : 'bg-paper border-rule'
                  }`}
                />
                <p className="font-mono text-[11px] text-faint">
                  {formatEventDateTime(entry.occurredAt)}
                </p>
                <p className="text-[14px] font-semibold text-ink mt-[3px]">
                  {EVENT_LABELS[entry.eventType]}
                </p>
                {showPlanDetails && (
                  <div className="flex items-center gap-[9px] mt-[7px]">
                    <span className="px-[9px] py-[3px] rounded-[6px] text-[11px] font-mono bg-olive-800 text-olive-50">
                      {planName}
                    </span>
                    {planPrice !== null && (
                      <span className="font-mono text-[11px] text-faint">
                        {(planPrice - discount).toLocaleString('es-BO')}/mes
                      </span>
                    )}
                  </div>
                )}
                {suspendedDates && suspendedDates.length > 0 && (
                  <div className="flex flex-wrap gap-[6px] mt-[7px]">
                    {[...suspendedDates].sort().map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded-[6px] text-[10.5px] font-mono bg-warn-bg border border-warn-border text-warn"
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
      </Card>
    </div>
  );
}
