import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { useDashboard } from '../hooks/useDashboard';
import { formatLongDate } from '../utils/format';
import { KpiCard } from './dashboard/KpiCard';
import { ContractEndingCard } from './dashboard/ContractEndingCard';
import { BirthdaysCard } from './dashboard/BirthdaysCard';
import { ConnectionsCard } from './dashboard/ConnectionsCard';
import { MenuStatusCard } from './dashboard/MenuStatusCard';

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd');
}

const todayBadge = (
  <div className="flex items-center gap-[9px] font-mono text-[12px] text-muted bg-paper border border-rule rounded-[9px] px-[14px] py-[9px]">
    <Icon name="calendar" size={15} stroke={1.7} className="text-olive-600" />
    {formatLongDate(todayIso(), { withYear: true })}
  </div>
);

export function DashboardPage() {
  const { summary, isLoading } = useDashboard();

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
          />
          <KpiCard
            icon="motorcycle"
            iconBg="bg-olive-100"
            iconColor="text-olive-700"
            label="Delivery"
            today={summary.deliveriesToday}
            singleCaption="Entregas hoy"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr_1fr] gap-[18px] items-start">
          <ContractEndingCard
            today={summary.contractEnding.today}
            tomorrow={summary.contractEnding.tomorrow}
          />
          <BirthdaysCard
            birthdays={summary.birthdays}
            monthLabel={format(new Date(), 'LLLL', { locale: es }).replace(/^\w/, (c) =>
              c.toUpperCase(),
            )}
          />
          <div className="flex flex-col gap-[18px]">
            <ConnectionsCard connections={summary.connections} />
            <MenuStatusCard today={summary.menus.today} tomorrow={summary.menus.tomorrow} />
          </div>
        </div>
      </div>
    </div>
  );
}
