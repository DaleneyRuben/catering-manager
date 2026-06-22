import { PageHeader } from '../components/ui/PageHeader';
import { DeliveryListCard } from './reports/DeliveryListCard';
import { KitchenReportCard } from './reports/KitchenReportCard';
import { MenuCard } from './reports/MenuCard';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../constants/roles';

export function ReportsPage() {
  const { user } = useAuth();

  return (
    <div className="px-4 py-5 lg:p-7 max-w-[1320px] mx-auto">
      <PageHeader label="Analítica" title="Informes" />

      <div className="flex flex-wrap gap-5">
        <DeliveryListCard />
        <MenuCard />
        {user?.role !== ROLES.KITCHEN && <KitchenReportCard />}
      </div>
    </div>
  );
}
