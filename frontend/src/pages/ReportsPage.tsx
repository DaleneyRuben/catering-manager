import { PageHeader } from '@/components/ui/PageHeader';
import { DeliveryListCard } from '@/features/reports/components/DeliveryListCard';
import { KitchenReportCard } from '@/features/reports/components/KitchenReportCard';
import { MenuCard } from '@/features/reports/components/MenuCard';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';

export function ReportsPage() {
  const { user } = useAuth();

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader label="Analítica" title="Informes" />

      <div className="flex flex-wrap items-start gap-5">
        <DeliveryListCard />
        <MenuCard />
        {user?.role !== ROLES.KITCHEN && <KitchenReportCard />}
      </div>
    </div>
  );
}
