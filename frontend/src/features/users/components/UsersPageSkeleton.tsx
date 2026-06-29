import { Skeleton } from '@/components/ui/Skeleton';

export function UsersPageSkeleton() {
  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="w-12 h-2.5" />
          <Skeleton className="w-28 h-7 rounded-[5px]" />
        </div>
        <Skeleton className="w-[150px] h-[38px] rounded-[9px]" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">
        {['a', 'b', 'c', 'd'].map((k) => (
          <div
            key={k}
            className="bg-paper border border-rule rounded-[13px] px-5 py-[18px] flex items-center gap-3.5"
          >
            <Skeleton className="w-[38px] h-[38px] rounded-[10px] shrink-0" />
            <div className="flex flex-col gap-2">
              <Skeleton className="w-8 h-6 rounded-[4px]" />
              <Skeleton className="w-16 h-2.5" />
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="w-[200px] h-[38px] rounded-[9px] mb-4" />

      <div className="bg-paper border border-rule rounded-[13px] overflow-hidden">
        <div className="border-b border-rule bg-olive-50 px-[22px] py-[13px] flex gap-8">
          {['a', 'b', 'c', 'd'].map((k) => (
            <Skeleton key={k} className="w-20 h-2.5" />
          ))}
        </div>
        {['a', 'b', 'c', 'd'].map((k) => (
          <div
            key={k}
            className="flex items-center gap-8 px-[22px] py-[13px] border-b border-cream-2 last:border-0"
          >
            <div className="flex items-center gap-3 w-40">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <Skeleton className="w-24 h-3.5" />
            </div>
            <Skeleton className="w-16 h-6 rounded-[7px]" />
            <Skeleton className="w-28 h-3" />
            <Skeleton className="w-14 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
