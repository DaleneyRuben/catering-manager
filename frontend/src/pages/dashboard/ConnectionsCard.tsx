import { Icon } from '../../components/ui/Icon';
import { formatConnectionStamp, formatRelativeTime } from '../../utils/format';
import type { Connection } from '../../types/dashboard';

interface RowProps {
  roleLabel: string;
  connection: Connection | null;
}

function ConnectionRow({ roleLabel, connection }: RowProps) {
  if (!connection) {
    return (
      <div className="flex items-center gap-[11px]">
        <span className="w-2 h-2 rounded-full bg-muted-dot shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-ink leading-tight">{roleLabel}</p>
          <p className="font-mono text-[10.5px] text-faint mt-0.5">Sin registro</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[11px]">
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          connection.online
            ? 'bg-olive-400 shadow-[0_0_0_3px_rgba(108,193,24,0.18)]'
            : 'bg-warn-dot shadow-[0_0_0_3px_rgba(205,160,26,0.16)]'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink leading-tight">{roleLabel}</p>
        <p className="font-mono text-[10.5px] text-faint mt-0.5">
          {formatConnectionStamp(connection.lastLoginAt)}
        </p>
      </div>
      <span
        className={`font-mono text-[11px] whitespace-nowrap ${connection.online ? 'text-olive-600' : 'text-faint'}`}
      >
        {formatRelativeTime(connection.lastLoginAt)}
      </span>
    </div>
  );
}

interface Props {
  kitchen: Connection | null;
  delivery: Connection | null;
}

export function ConnectionsCard({ kitchen, delivery }: Props) {
  return (
    <div className="bg-paper border border-rule rounded-[14px] px-6 py-[22px]">
      <div className="flex items-center gap-[11px] mb-[18px]">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="wifi" size={17} stroke={1.6} />
        </span>
        <h2 className="font-serif font-semibold text-[20px] text-ink m-0">Última conexión</h2>
      </div>
      <div className="flex flex-col gap-[14px]">
        <ConnectionRow roleLabel="Cocina" connection={kitchen} />
        <ConnectionRow roleLabel="Delivery" connection={delivery} />
      </div>
    </div>
  );
}
