import { format, parseISO } from 'date-fns';
import { Card } from '@ui/Card';
import { Skeleton } from '@ui/Skeleton';
import { useClientHistory } from '@/features/clients/hooks/useClientHistory';
import { formatDate } from '@/utils/format';
import { EVENT_LABELS } from '@/features/clients/constants/historyEvents';
import { ClientHistorySummary } from '@/features/clients/components/detail/ClientHistorySummary';
import { DeliveryCalendarCard } from '@/features/clients/components/detail/DeliveryCalendarCard';
import { buildDeliveryCalendar } from '@/features/clients/utils/deliveryCalendar';
import type { Subscription } from '@/features/clients/types';

function formatEventDateTime(iso: string) {
  return `${formatDate(iso)} · ${format(parseISO(iso), 'HH:mm')}`;
}

interface Props {
  clientId: string;
  currentPlanName?: string | null;
  sub?: Subscription;
  isEnded?: boolean;
}

export function ClientHistoryTab({
  clientId,
  currentPlanName = null,
  sub,
  isEnded = false,
}: Props) {
  const { history, isLoading } = useClientHistory(clientId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-[28px]">
        <div className="px-0.5 py-1.5 flex flex-col gap-3">
          <Skeleton className="w-16 h-2.5" />
          <Skeleton className="w-48 h-7 rounded-[5px]" />
          <Skeleton className="w-full h-3" />
          <Skeleton className="w-3/4 h-3" />
          <div className="flex flex-col border-t border-hairline mt-3">
            {['a', 'b', 'c'].map((k) => (
              <div
                key={k}
                className="flex items-center justify-between py-[13px] border-b border-cream-2"
              >
                <Skeleton className="w-28 h-3" />
                <Skeleton className="w-16 h-3" />
              </div>
            ))}
          </div>
        </div>
        <Card padding="26px 28px">
          <div className="relative flex flex-col gap-[22px] pl-[18px]">
            <div className="absolute left-[5px] top-[6px] bottom-[6px] w-px bg-cream-2" />
            {['a', 'b', 'c', 'd'].map((k) => (
              <div key={k} className="relative">
                <Skeleton className="absolute -left-[18px] top-[4px] w-[12px] h-[12px] rounded-full" />
                <Skeleton className="w-28 h-2.5 mb-[6px]" />
                <Skeleton className="w-40 h-4" />
              </div>
            ))}
          </div>
        </Card>
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

  const showDeliveryCalendar = isEnded && !!sub && !!sub.startDate && !!sub.contractEndDate;
  const calendar = showDeliveryCalendar
    ? buildDeliveryCalendar({
        contractStart: sub!.startDate as string,
        contractEndDate: sub!.contractEndDate as string,
        asOf: sub!.contractEndDate as string,
        suspendedDates: sub!.suspendedDates,
      })
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-[28px]">
      <div>
        <ClientHistorySummary
          eventCount={history.length}
          planName={currentPlanName}
          clientSince={clientSince}
        />
      </div>
      <div className="flex flex-col gap-[20px]">
        {calendar && (
          <DeliveryCalendarCard
            rangeLabel={`${formatDate(sub!.startDate)} → ${formatDate(sub!.contractEndDate)}`}
            months={calendar.months}
            deliveredCount={calendar.deliveredCount}
            suspendedCount={sub!.suspendedDates.length}
            showPendingLegend={false}
          />
        )}
        <Card padding="26px 28px">
          <div className="relative flex flex-col gap-[22px] pl-[18px]">
            <div className="absolute left-[5px] top-[6px] bottom-[6px] w-px bg-rule" />
            {history.map((entry, i) => {
              const meta = entry.metadata;
              const planName = typeof meta?.planName === 'string' ? meta.planName : null;
              const planPrice =
                meta?.planPrice !== null ? parseFloat(String(meta.planPrice)) : null;
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
    </div>
  );
}
