import { Icon } from '@ui/Icon';
import { formatConnectionStamp, formatRelativeTime, formatDevice } from '@/utils/format';
import type { Connection } from '@/features/dashboard/types';

interface RowProps {
  connection: Connection;
}

function ConnectionRow({ connection }: RowProps) {
  const device = formatDevice(connection.lastBrowser, connection.lastOs, connection.lastDeviceType);

  return (
    <div className="flex items-start gap-[11px]">
      {/* mt centers the 8px dot against the 13.5px username line, which items-start pins to the top */}
      <span
        className={`w-2 h-2 rounded-full shrink-0 mt-[5px] ${
          connection.online
            ? 'bg-olive-400 shadow-[var(--shadow-glow-online)]'
            : 'bg-warn-dot shadow-[var(--shadow-glow-offline)]'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink leading-tight">{connection.username}</p>
        <p className="font-mono text-[10.5px] text-faint mt-0.5">
          {formatConnectionStamp(connection.lastLoginAt)}
        </p>
        {device && <p className="font-mono text-[10.5px] text-muted mt-0.5 truncate">{device}</p>}
      </div>
      <span
        className={`font-mono text-[11px] whitespace-nowrap mt-[2px] ${connection.online ? 'text-olive-600' : 'text-faint'}`}
      >
        {formatRelativeTime(connection.lastLoginAt)}
      </span>
    </div>
  );
}

interface Props {
  connections: Connection[];
}

export function ConnectionsCard({ connections }: Props) {
  return (
    <div className="bg-paper border border-rule rounded-[14px] px-6 py-[22px]">
      <div className="flex items-center gap-[11px] mb-[18px]">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="wifi" size={17} stroke={1.6} />
        </span>
        <h2 className="font-serif font-semibold text-[20px] text-ink m-0">Última conexión</h2>
      </div>
      {connections.length === 0 ? (
        <p className="font-mono text-[12px] text-faint">Sin registro</p>
      ) : (
        <div className="flex flex-col gap-[14px]">
          {connections.map((c) => (
            <ConnectionRow key={c.username} connection={c} />
          ))}
        </div>
      )}
    </div>
  );
}
