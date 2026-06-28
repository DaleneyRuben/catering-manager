import { Skeleton } from '../../components/ui/Skeleton';

const HEADERS = ['Cliente', 'Plan', 'Zona', 'Nacimiento', 'Contrato', 'Estado', 'Precio'];
const ROW_COUNT = 8;

export function ClientTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-cream-2 border-b border-rule text-[10.5px] font-mono uppercase tracking-widest text-muted">
            {HEADERS.map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={i} className="border-b border-rule last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="w-32 h-3.5" />
                    <Skeleton className="w-20 h-2.5" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Skeleton className="w-16 h-5 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="w-14 h-3.5" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="w-20 h-3.5" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="w-36 h-3.5" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="w-16 h-5 rounded-full" />
              </td>
              <td className="px-4 py-3 flex justify-end">
                <Skeleton className="w-12 h-3.5" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
