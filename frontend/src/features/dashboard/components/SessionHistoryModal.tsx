import { differenceInMinutes, parseISO } from 'date-fns';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { useSessionHistory, type SessionEntry } from '@/features/dashboard/hooks/useSessionHistory';
import { ROLES, ROLE_LABELS } from '@/constants/roles';
import { deviceIcon, formatDayGroupLabel, formatDevice, formatTime } from '@/utils/format';
import { groupByDay } from '@/utils/groupByDay';

interface Props {
  onClose: () => void;
}

// Same threshold as the connections widget's online rule
const isActiveSession = (iso: string) => differenceInMinutes(new Date(), parseISO(iso)) < 60;

// The panel history tracks operational staff only, not admin logins
const SESSION_ROLES = [ROLES.KITCHEN, ROLES.DELIVERY];

function SessionRow({ entry }: { entry: SessionEntry }) {
  const active = isActiveSession(entry.createdAt);
  const meta = formatDevice(entry.browser, entry.os, entry.deviceType);

  return (
    <div
      className={`flex items-center gap-[13px] px-3.5 py-3 rounded-[10px] border ${
        active
          ? 'bg-menu-loaded-bg border-menu-loaded-border'
          : 'bg-paper border-history-row-border'
      }`}
    >
      <span className="w-[30px] h-[30px] rounded-lg bg-device-chip-bg text-olive-600 flex items-center justify-center shrink-0">
        <Icon name={deviceIcon(entry.deviceType) ?? 'history'} size={16} stroke={1.7} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-ink leading-tight truncate">
            {entry.username}
          </span>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[.06em] rounded-[5px] px-1.5 py-0.5 text-muted bg-cream-2 whitespace-nowrap">
            {ROLE_LABELS[entry.role]}
          </span>
        </div>
        <p
          className={`font-mono text-[10px] tracking-[.02em] text-faint mt-[3px] truncate ${
            meta ? '' : 'italic'
          }`}
        >
          {meta ?? 'Dispositivo desconocido'}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-[11px] font-semibold text-ink-2 leading-tight tabular-nums">
          {formatTime(entry.createdAt)}
        </p>
        {active && (
          <span className="inline-block mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[.05em] text-olive-700 bg-ok-bg rounded-[5px] px-[7px] py-[2px]">
            Activa
          </span>
        )}
      </div>
    </div>
  );
}

export function SessionHistoryModal({ onClose }: Props) {
  const { entries, isLoading } = useSessionHistory(SESSION_ROLES);

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
            <SessionRow key={`${entry.username}-${entry.createdAt}`} entry={entry} />
          ))}
        </div>
      </div>
    ));
  };

  return (
    <Modal
      onClose={onClose}
      className="w-[min(560px,92vw)] max-h-[82vh] flex flex-col overflow-hidden"
    >
      <div className="flex items-start gap-[13px] px-6 pt-[22px] pb-[18px] border-b border-hairline">
        <span className="w-9 h-9 rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="history" size={18} stroke={1.6} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-semibold text-[23px] leading-[1.1] text-ink">
            Historial de sesiones
          </p>
          <p className="font-mono text-[10.5px] tracking-[.04em] text-faint mt-1">
            {entries.length} sesiones · últimas 2 semanas
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

      <div className="overflow-y-auto px-6 pt-2 pb-[22px]">{renderBody()}</div>
    </Modal>
  );
}
