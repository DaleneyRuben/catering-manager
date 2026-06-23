import { Button } from '../../components/ui/Button';
import type { Subscription } from '../../types/client';
import { formatDate } from '../../utils/format';

interface Props {
  sub: Subscription | undefined;
  onSuspend: () => void;
}

export function ClientSuspensionsTab({ sub, onSuspend }: Props) {
  return (
    <div className="bg-paper border border-rule rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted font-semibold">
          Suspensiones
        </p>
        <Button onClick={onSuspend} size="sm" leftIcon="calendar">
          Suspender
        </Button>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-serif text-[32px] leading-none text-ink">
          {sub?.suspendedDates?.length ?? 0}
        </span>
        <span className="text-[12.5px] text-muted">días suspendidos</span>
      </div>
      {sub && (sub.suspendedDates?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-2">
          {[...(sub.suspendedDates ?? [])].sort().map((d) => (
            <span
              key={d}
              className="px-2.5 py-1 rounded-md text-[12px] font-mono bg-warn-bg border border-warn-border text-warn"
            >
              {formatDate(d)}
            </span>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[12px] text-muted">Sin suspensiones registradas.</p>
      )}
    </div>
  );
}
