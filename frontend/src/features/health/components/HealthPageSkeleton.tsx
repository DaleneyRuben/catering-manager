import { Skeleton } from '@ui/Skeleton';

const METRIC_COUNT = 4;
const SERVICE_ROW_COUNT = 2;

export function HealthPageSkeleton() {
  return (
    <>
      <div
        data-testid="health-skeleton-banner"
        className="rounded-[14px] p-[22px] flex items-center gap-[18px] mb-5 bg-paper border border-rule"
      >
        <Skeleton className="w-[46px] h-[46px] rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="w-64 h-5" />
          <Skeleton className="w-80 h-3" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="w-28 h-2.5" />
          <Skeleton className="w-24 h-3.5" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">
        {Array.from({ length: METRIC_COUNT }).map((_, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            data-testid="health-skeleton-metric"
            className="bg-paper border border-rule rounded-[14px] px-5 py-[18px] flex flex-col gap-3"
          >
            <Skeleton className="w-16 h-2.5" />
            <Skeleton className="w-14 h-7" />
          </div>
        ))}
      </div>

      <Skeleton className="w-56 h-6 mb-4" />
      <div
        data-testid="health-skeleton-services"
        className="bg-paper border border-rule rounded-[14px] px-[24px] py-[18px] flex flex-col gap-4"
      >
        {Array.from({ length: SERVICE_ROW_COUNT }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-[11px]">
              <Skeleton className="w-[30px] h-[30px] rounded-[8px] shrink-0" />
              <Skeleton className="w-32 h-3.5" />
            </div>
            <Skeleton className="w-16 h-3" />
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>
        ))}
      </div>
    </>
  );
}
