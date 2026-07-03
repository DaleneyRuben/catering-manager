import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { useLoginHistory, type LoginEntry } from '@/features/users/hooks/useLoginHistory';
import { formatDateTime, formatDevice } from '@/utils/format';
import type { AppUser } from '@/features/users/hooks/useUsers';

interface Props {
  user: AppUser;
  onClose: () => void;
}

function EntryRow({ entry }: { entry: LoginEntry }) {
  const device = formatDevice(entry.browser, entry.os, entry.deviceType);

  return (
    <div className="flex items-center justify-between gap-4 py-[10px] border-b border-hairline last:border-0">
      <span className="font-mono text-[12px] text-ink-2 tabular-nums whitespace-nowrap">
        {formatDateTime(entry.createdAt)}
      </span>
      <span className={`text-[12.5px] truncate ${device ? 'text-muted' : 'text-faint italic'}`}>
        {device ?? 'Dispositivo desconocido'}
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
    return entries.map((entry) => <EntryRow key={entry.createdAt} entry={entry} />);
  };

  return (
    <Modal onClose={onClose} className="w-[min(480px,92vw)]">
      <div className="flex items-center gap-3 px-[28px] py-[22px] border-b border-hairline">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="history" size={17} stroke={1.6} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-semibold text-[23px] leading-none text-ink">
            Historial de acceso
          </p>
          <p className="font-mono text-[11px] text-muted mt-[6px]">{user.username}</p>
        </div>
        <IconButton
          icon="x"
          label="Cerrar"
          onClick={onClose}
          size={20}
          stroke={1.8}
          className="p-1 text-faint hover:text-ink-2"
        />
      </div>

      <div className="px-[28px] py-[18px] max-h-[min(420px,60vh)] overflow-y-auto">
        {renderBody()}
      </div>
    </Modal>
  );
}
