import { DeliveryListCard } from './reports/DeliveryListCard';
import { KitchenReportCard } from './reports/KitchenReportCard';
import { MenuCard } from './reports/MenuCard';

export function ReportsPage() {
  return (
    <div className="p-7 max-w-[1320px] mx-auto">
      <div className="mb-7">
        <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2">
          Analítica
        </p>
        <h1 className="font-serif text-[44px] leading-none text-ink">Informes</h1>
        <p className="text-[13px] text-muted mt-2.5">
          Genera informes de clientes activos, vencimientos y métricas de servicio.
        </p>
      </div>

      <div className="flex flex-wrap gap-5">
        <DeliveryListCard />
        <MenuCard />
        <KitchenReportCard />
      </div>
    </div>
  );
}
