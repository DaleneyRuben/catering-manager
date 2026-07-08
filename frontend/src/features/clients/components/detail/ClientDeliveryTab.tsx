import { format } from 'date-fns';
import type { Client, Subscription } from '@/features/clients/types';
import { buildDeliveryCalendar } from '@/features/clients/utils/deliveryCalendar';
import { DeliveryCalendarCard } from '@/features/clients/components/detail/DeliveryCalendarCard';
import { ContractSummaryCard } from '@/features/clients/components/detail/ContractSummaryCard';
import { ClientGroupTab } from '@/features/clients/components/detail/ClientGroupTab';
import { formatDate } from '@/utils/format';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  onSuspend: () => void;
}

export function ClientDeliveryTab({ client, sub, onSuspend }: Props) {
  if (!sub) {
    return <p className="text-[13px] text-muted">Sin suscripción activa.</p>;
  }

  const hasContractDates = !!sub.startDate && !!sub.contractEndDate;
  const calendar = hasContractDates
    ? buildDeliveryCalendar({
        contractStart: sub.startDate as string,
        contractEndDate: sub.contractEndDate as string,
        asOf: format(new Date(), 'yyyy-MM-dd'),
        suspendedDates: sub.suspendedDates,
      })
    : null;
  const rangeLabel = hasContractDates
    ? `${formatDate(sub.startDate)} → ${formatDate(sub.contractEndDate)}`
    : '';

  return (
    <div className="grid grid-cols-12 gap-[20px]">
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-[20px]">
        {calendar ? (
          <DeliveryCalendarCard
            rangeLabel={rangeLabel}
            months={calendar.months}
            deliveredCount={calendar.deliveredCount}
            suspendedCount={sub.suspendedDates.length}
            showPendingLegend
          />
        ) : (
          <p className="font-mono text-[12px] text-muted">Sin fechas de contrato definidas.</p>
        )}
      </div>
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-[20px]">
        {calendar && (
          <ContractSummaryCard
            rangeLabel={rangeLabel}
            deliveredCount={calendar.deliveredCount}
            suspendedCount={sub.suspendedDates.length}
            onSuspend={onSuspend}
          />
        )}
        <ClientGroupTab clientId={client.id} initialMembers={client.groupMembers} />
      </div>
    </div>
  );
}
