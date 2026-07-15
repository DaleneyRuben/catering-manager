import { Skeleton } from '@ui/Skeleton';

// Loading state for the "Clientes activos por día" grid: mirrors the real day
// cell (bordered container, weekday label bar, count bar) instead of a slab.
export function WeekCellsSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-3.5 max-md:grid-cols-1">
      {[0, 1, 2, 3, 4].map((key) => (
        <div
          key={key}
          className="min-w-0 rounded-[11px] border bg-week-cell-bg border-week-cell-border px-[15px] pt-[15px] pb-4 flex flex-col gap-3"
        >
          <Skeleton className="w-12 h-2.5" />
          <div className="flex items-baseline gap-1">
            <Skeleton className="w-12 h-8 rounded-[5px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
