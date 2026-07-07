import { PageHeader } from '@ui/PageHeader';
import { DeliveryListCard } from '@/features/reports/components/DeliveryListCard';
import { KitchenReportCard } from '@/features/reports/components/KitchenReportCard';
import { MenuCard } from '@/features/reports/components/MenuCard';
import { ReportsPageSkeleton } from '@/features/reports/components/ReportsPageSkeleton';
import { useMenu } from '@/features/menu/hooks/useMenu';
import { useAuth } from '@/features/auth/AuthContext';
import { ROLES } from '@/constants/roles';

export function ReportsPage() {
  const { user } = useAuth();
  const { menus, isLoading } = useMenu();
  const showKitchenCard = user?.role !== ROLES.KITCHEN;

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader label="Analítica" title="Informes" />

      {isLoading ? (
        <ReportsPageSkeleton showKitchenCard={showKitchenCard} />
      ) : (
        <div className="flex flex-wrap items-start gap-5">
          <DeliveryListCard />
          <MenuCard menus={menus} />
          {showKitchenCard && <KitchenReportCard menus={menus} />}
        </div>
      )}
    </div>
  );
}
