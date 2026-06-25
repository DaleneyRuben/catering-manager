import { Skeleton } from '../../components/ui/Skeleton';

export function ClientDetailSkeleton() {
  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <Skeleton className="w-20 h-3 mb-5" />

      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="w-[62px] h-[62px] rounded-full shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-48 h-8 rounded-[5px]" />
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
            <Skeleton className="w-64 h-2.5" />
          </div>
        </div>
        <div className="flex gap-2.5">
          <Skeleton className="w-[100px] h-[38px] rounded-[9px]" />
          <Skeleton className="w-[100px] h-[38px] rounded-[9px]" />
          <Skeleton className="w-9 h-9 rounded-[9px]" />
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-rule pb-0">
        {['a', 'b', 'c'].map((k) => (
          <Skeleton key={k} className="w-24 h-8 rounded-t-[8px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-[220px] rounded-[14px]" />
        <Skeleton className="h-[220px] rounded-[14px]" />
      </div>
    </div>
  );
}
