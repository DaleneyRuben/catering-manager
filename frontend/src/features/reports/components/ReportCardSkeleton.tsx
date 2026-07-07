import { Skeleton } from '@ui/Skeleton';

export function ReportCardSkeleton() {
  return (
    <div className="flex-[1_1_340px] min-w-[320px] bg-paper border border-rule rounded-[14px] px-[26px] py-[24px] flex flex-col">
      <div className="flex items-center gap-[11px] mb-3">
        <Skeleton className="w-9 h-9 rounded-[10px] shrink-0" />
        <Skeleton className="w-40 h-5" />
      </div>
      <Skeleton className="w-full h-3 mb-1.5" />
      <Skeleton className="w-2/3 h-3 mb-[18px]" />

      <Skeleton className="w-16 h-2.5 mb-[9px]" />
      <div className="flex gap-2 mb-[18px]">
        <Skeleton className="flex-1 h-[38px] rounded-[8px]" />
        <Skeleton className="flex-1 h-[38px] rounded-[8px]" />
      </div>

      <Skeleton className="w-full h-[42px] rounded-[8px] mt-auto" />
    </div>
  );
}
