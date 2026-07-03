import { PageHeader } from '@ui/PageHeader';
import { Skeleton } from '@ui/Skeleton';
import { useProduction } from '@/features/production/hooks/useProduction';
import { ProductionCard } from '@/features/production/components/ProductionCard';

function ProductionSkeleton() {
  return (
    <div className="bg-paper border border-rule rounded-[14px] px-7 py-6">
      <div className="flex items-start justify-between gap-5 mb-[22px]">
        <div className="flex flex-col gap-3">
          <Skeleton className="w-52 h-6 rounded-[5px]" />
          <Skeleton className="w-36 h-2.5" />
        </div>
        <Skeleton className="w-[210px] h-[36px] rounded-[9px] shrink-0" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(188px,1fr))] gap-5 max-md:grid-cols-1">
        {['juice', 'lunchOnly', 'lunchAndDinner', 'full'].map((key) => (
          <div key={key} className="flex flex-col gap-3">
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-full h-3.5" />
            <Skeleton className="w-full h-3.5" />
            <Skeleton className="w-3/4 h-3.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductionPage() {
  const { summary, isLoading } = useProduction();

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:pt-[34px] lg:pb-[48px]">
      <PageHeader label="Cocina · planificación" title="Producción" />
      {isLoading || !summary ? <ProductionSkeleton /> : <ProductionCard summary={summary} />}
    </div>
  );
}
