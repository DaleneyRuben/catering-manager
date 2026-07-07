import { Skeleton } from '@ui/Skeleton';

const ROW_COUNT = 3;

export function PlanRadioListSkeleton() {
  return (
    <div className="flex flex-col gap-[10px]">
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          data-testid="plan-radio-skeleton-row"
          className="flex items-center justify-between gap-4 py-[14px] px-[18px] rounded-[11px] border-[1.5px] border-rule bg-white"
        >
          <div className="flex items-center gap-[13px]">
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
            <div className="flex flex-col gap-[6px]">
              <Skeleton className="w-24 h-3.5" />
              <Skeleton className="w-16 h-2.5" />
            </div>
          </div>
          <Skeleton className="w-14 h-5" />
        </div>
      ))}
    </div>
  );
}
