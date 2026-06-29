import { format, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '@ui/Icon';
import { PageHeader } from '@ui/PageHeader';
import { Skeleton } from '@ui/Skeleton';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { formatLongDate } from '@/utils/format';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { ContractEndingCard } from '@/features/dashboard/components/ContractEndingCard';
import { BirthdaysCard } from '@/features/dashboard/components/BirthdaysCard';
import { ConnectionsCard } from '@/features/dashboard/components/ConnectionsCard';
import { MenuStatusCard } from '@/features/dashboard/components/MenuStatusCard';

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getDayLabels() {
  if (!isWeekend(new Date())) {
    return { todayLabel: 'hoy', tomorrowLabel: 'mañana', deliveryCaption: 'Entregas hoy' };
  }
  return { todayLabel: 'lunes', tomorrowLabel: 'martes', deliveryCaption: 'Entregas el lunes' };
}

const todayBadge = (
  <div className="flex items-center gap-[9px] font-mono text-[12px] text-muted bg-paper border border-rule rounded-[9px] px-[14px] py-[9px]">
    <Icon name="calendar" size={15} stroke={1.7} className="text-olive-600" />
    {formatLongDate(todayIso(), { withYear: true })}
  </div>
);

export function DashboardPage() {
  const { summary, isLoading } = useDashboard();
  const { todayLabel, tomorrowLabel, deliveryCaption } = getDayLabels();
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (isLoading || !summary) {
    return (
      <div className="px-4 py-5 lg:px-[44px] lg:pt-[34px] lg:pb-[48px]">
        <PageHeader label="Resumen operativo" title="Panel" action={todayBadge} />
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px]">
            {['a', 'b', 'c'].map((k) => (
              <div
                key={k}
                className="bg-paper border border-rule rounded-[14px] p-[22px] flex flex-col gap-3"
              >
                <Skeleton className="w-9 h-9 rounded-[10px]" />
                <Skeleton className="w-20 h-2.5 mt-1" />
                <Skeleton className="w-12 h-8 rounded-[5px]" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr_1fr] gap-[18px]">
            {['a', 'b', 'c'].map((k) => (
              <Skeleton key={k} className="h-[160px] rounded-[14px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:pt-[34px] lg:pb-[48px]">
      <PageHeader label="Resumen operativo" title="Panel" action={todayBadge} />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px]">
          <KpiCard
            icon="clipboard-check"
            iconBg="bg-olive-100"
            iconColor="text-olive-700"
            label="Activos"
            today={summary.active.today}
            todayColor="text-ink"
            tomorrow={summary.active.tomorrow}
            tomorrowColor="text-olive-700"
            todayLabel={todayLabel}
            tomorrowLabel={tomorrowLabel}
          />
          <KpiCard
            icon="pause"
            iconBg="bg-cream-2"
            iconColor="text-muted"
            label="Suspendidos"
            today={summary.suspended.today}
            todayColor="text-ink"
            tomorrow={summary.suspended.tomorrow}
            tomorrowColor="text-warn"
            todayLabel={todayLabel}
            tomorrowLabel={tomorrowLabel}
          />
          <KpiCard
            icon="motorcycle"
            iconBg="bg-olive-100"
            iconColor="text-olive-700"
            label="Delivery"
            today={summary.deliveriesToday}
            singleCaption={deliveryCaption}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr_1fr] gap-[18px] items-start">
          <ContractEndingCard
            today={summary.contractEnding.today}
            tomorrow={summary.contractEnding.tomorrow}
            todayLabel={todayLabel}
            tomorrowLabel={tomorrowLabel}
          />
          <BirthdaysCard
            birthdays={summary.birthdays}
            monthLabel={format(new Date(), 'LLLL', { locale: es }).replace(/^\w/, (c) =>
              c.toUpperCase(),
            )}
          />
          <div className="flex flex-col gap-[18px]">
            <ConnectionsCard connections={summary.connections} />
            <MenuStatusCard
              today={summary.menus.today}
              tomorrow={summary.menus.tomorrow}
              todayLabel={capitalize(todayLabel)}
              tomorrowLabel={capitalize(tomorrowLabel)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
