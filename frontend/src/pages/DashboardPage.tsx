import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { useDashboard } from '../hooks/useDashboard';
import { formatLongDate } from '../utils/format';
import { KpiCard } from './dashboard/KpiCard';
import { ContractEndingCard } from './dashboard/ContractEndingCard';
import { BirthdaysCard } from './dashboard/BirthdaysCard';
import { ConnectionsCard } from './dashboard/ConnectionsCard';
import { MenuStatusCard } from './dashboard/MenuStatusCard';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
      <div className="px-[44px] pt-[34px] pb-[48px]">
        <PageHeader label="Resumen operativo" title="Panel" action={todayBadge} />
        <div className="py-16 text-center text-muted font-mono text-[12px]">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="px-[44px] pt-[34px] pb-[48px]">
      <PageHeader label="Resumen operativo" title="Panel" action={todayBadge} />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-[18px]">
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

        <div
          className="grid gap-[18px] items-start"
          style={{ gridTemplateColumns: '1.15fr 1fr 1fr' }}
        >
          <ContractEndingCard
            today={summary.contractEnding.today}
            tomorrow={summary.contractEnding.tomorrow}
          />
          <BirthdaysCard
            birthdays={summary.birthdays}
            monthLabel={new Date()
              .toLocaleString('es', { month: 'long' })
              .replace(/^\w/, (c) => c.toUpperCase())}
          />
          <div className="flex flex-col gap-[18px]">
            <ConnectionsCard
              kitchen={summary.connections.kitchen}
              delivery={summary.connections.delivery}
            />
            <MenuStatusCard today={summary.menus.today} tomorrow={summary.menus.tomorrow} />
          </div>
        </div>
      </div>
    </div>
  );
}
