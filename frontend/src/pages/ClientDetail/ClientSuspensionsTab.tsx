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
      <div className="flex items-center mb-4">
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-0.5">
            Días suspendidos
          </p>
          <p className="font-serif text-[32px] leading-none text-ink">
            {sub?.suspendedDates?.length ?? 0}
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={onSuspend} leftIcon="calendar">
            Suspender días
          </Button>
        </div>
      </div>
      {sub && (sub.suspendedDates?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-2">
          {[...(sub.suspendedDates ?? [])].sort().map((d) => (
            <span
              key={d}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono"
              style={{ background: '#f3eedc', color: '#6b4f08' }}
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
