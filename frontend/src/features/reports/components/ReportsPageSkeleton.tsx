import { ReportCardSkeleton } from '@/features/reports/components/ReportCardSkeleton';

interface Props {
  showKitchenCard: boolean;
}

export function ReportsPageSkeleton({ showKitchenCard }: Props) {
  return (
    <div className="flex flex-wrap items-start gap-5">
      <ReportCardSkeleton />
      <ReportCardSkeleton />
      {showKitchenCard && <ReportCardSkeleton />}
    </div>
  );
}
