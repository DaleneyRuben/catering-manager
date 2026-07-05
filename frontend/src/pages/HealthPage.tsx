import { Button } from '@ui/Button';
import { Icon } from '@ui/Icon';
import { PageHeader } from '@ui/PageHeader';
import { useHealth } from '@/features/health/hooks/useHealth';
import { HealthStatusBanner } from '@/features/health/components/HealthStatusBanner';
import { HealthMetricsGrid } from '@/features/health/components/HealthMetricsGrid';
import { HealthServicesTable } from '@/features/health/components/HealthServicesTable';

export function HealthPage() {
  const { report, isLoading, isFetching, refresh } = useHealth();

  const api = report?.services.find((s) => s.name === 'API La Oliva');
  const database = report?.services.find((s) => s.name === 'Base de datos');

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader
        label="Estado del sistema"
        title="Health"
        action={
          <Button
            variant="bare"
            onClick={() => refresh()}
            className="font-semibold bg-paper text-olive-700 border border-olive-200 hover:bg-olive-100 transition-colors"
            style={{ padding: '11px 18px', fontSize: '13.5px', lineHeight: 'normal' }}
          >
            <Icon
              name="refresh"
              size={16}
              stroke={1.8}
              className={isFetching ? 'animate-spin' : ''}
            />
            Probar conexión
          </Button>
        }
      />

      {isLoading || !report ? (
        <div className="flex items-center gap-4 p-4 rounded-lg border border-rule bg-paper">
          <Icon name="refresh" size={20} className="text-muted animate-spin" />
          <span className="text-muted text-sm">Verificando...</span>
        </div>
      ) : (
        <>
          <HealthStatusBanner status={report.status} checkedAt={report.checkedAt} />

          <HealthMetricsGrid
            apiLatencyMs={api?.latencyMs}
            dbLatencyMs={database?.latencyMs}
            memoryUsedMb={report.process.memoryUsedMb}
            uptimeSeconds={report.process.uptimeSeconds}
          />

          <HealthServicesTable services={report.services} />
        </>
      )}
    </div>
  );
}
