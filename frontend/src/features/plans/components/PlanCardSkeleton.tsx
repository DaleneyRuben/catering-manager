import { Skeleton } from '@ui/Skeleton';

const CARD_COUNT = 3;

export function PlanCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="p-[18px] rounded-lg bg-paper border border-rule">
          <Skeleton className="w-8 h-2.5 mb-3" />
          <Skeleton className="w-40 h-6 mb-2" />
          <Skeleton className="w-24 h-8 mb-4" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((__, j) => (
              // eslint-disable-next-line react/no-array-index-key
              <Skeleton key={j} className="w-16 h-5 rounded-full" />
            ))}
          </div>
          <div className="h-px bg-rule my-3.5" />
          <Skeleton className="w-28 h-3" />
        </div>
      ))}
    </div>
  );
}
