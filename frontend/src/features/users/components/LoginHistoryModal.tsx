import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { useLoginHistory, type LoginEntry } from '@/features/users/hooks/useLoginHistory';
import { ROLE_ICON_CLASSES } from '@/features/users/roleStyles';
import { initials } from '@/utils/string';
import {
  deviceIcon,
  formatBrowserOs,
  formatDayGroupLabel,
  formatDeviceType,
  formatTime,
} from '@/utils/format';
import { groupByDay } from '@/utils/groupByDay';
import type { AppUser } from '@/features/users/hooks/useUsers';

interface Props {
  user: AppUser;
  onClose: () => void;
}

function EntryRow({ entry }: { entry: LoginEntry }) {
  const meta = formatBrowserOs(entry.browser, entry.os);
  const deviceLabel = formatDeviceType(entry.deviceType);

  return (
    <div className="flex items-center gap-[13px] px-3.5 py-[11px] rounded-[10px] bg-paper border border-history-row-border">
      <span className="w-[30px] h-[30px] rounded-lg bg-device-chip-bg text-olive-600 flex items-center justify-center shrink-0">
        <Icon name={deviceIcon(entry.deviceType) ?? 'history'} size={16} stroke={1.7} />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[13px] font-semibold leading-tight truncate ${
            meta ? 'text-ink' : 'text-faint italic'
          }`}
        >
          {meta ?? 'Dispositivo desconocido'}
        </p>
        {deviceLabel && (
          <p className="font-mono text-[10px] tracking-[.03em] text-faint mt-[3px]">
            {deviceLabel}
          </p>
        )}
      </div>
      <span className="font-mono text-[11.5px] font-semibold text-ink-2 tabular-nums whitespace-nowrap shrink-0">
        {formatTime(entry.createdAt)}
      </span>
    </div>
  );
}

export function LoginHistoryModal({ user, onClose }: Props) {
  const { entries, isLoading } = useLoginHistory(user.id);

  const renderBody = () => {
    if (isLoading) return <p className="font-mono text-[12px] text-faint py-3">Cargando…</p>;
    if (entries.length === 0) {
      return <p className="font-mono text-[12px] text-faint py-3">Sin inicios de sesión</p>;
    }
    return groupByDay(entries).map((group) => (
      <div key={group.date}>
        <p className="font-mono text-[9.5px] uppercase tracking-[.2em] text-day-label pt-4 pb-[9px]">
          {formatDayGroupLabel(group.date)}
        </p>
        <div className="flex flex-col gap-2">
          {group.items.map((entry) => (
            <EntryRow key={entry.createdAt} entry={entry} />
          ))}
        </div>
      </div>
    ));
  };

  return (
    <Modal
      onClose={onClose}
      className="w-[min(520px,92vw)] max-h-[82vh] flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-[13px] px-6 pt-5 pb-[18px] border-b border-hairline">
        <div
          className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-mono text-[12.5px] font-semibold shrink-0 ${ROLE_ICON_CLASSES[user.role]}`}
        >
          {initials(user.username)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-semibold text-[22px] leading-[1.1] text-ink truncate">
            {user.username}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[.06em] text-faint mt-[3px]">
            Historial de accesos · últimas 2 semanas
          </p>
        </div>
        <IconButton
          icon="x"
          label="Cerrar"
          onClick={onClose}
          size={19}
          stroke={1.8}
          className="p-1 rounded-[7px] shrink-0 text-faint hover:text-ink hover:bg-cream-2"
        />
      </div>

      <div className="overflow-y-auto px-6 pt-[6px] pb-[22px]">{renderBody()}</div>
    </Modal>
  );
}
