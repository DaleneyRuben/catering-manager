import { format, parseISO } from 'date-fns';
import { Icon } from '@ui/Icon';
import { Button } from '@ui/Button';
import { formatRenewalMeta } from '@/features/clients/utils/queuedRenewal';
import type { Subscription } from '@/features/clients/types';

interface Props {
  renewal: Subscription;
  isPaused: boolean;
  onDelete: () => void;
  onAssignStartDate: () => void;
}

// Olive, not amber: a registered renewal is reassuring information, while amber already carries
// "por vencer" and suspensions. A paused client keeps the amber pause banner and absorbs the
// renewal into it, so the header never stacks two notices.
const PAUSED_STYLES = {
  box: 'bg-warn-bg border-warn-border',
  icon: 'text-warn',
  title: 'text-warn-text-strong',
  text: 'text-warn-text',
  deleteHoverBg: 'hover:bg-warn-border',
};
const QUEUED_STYLES = {
  box: 'bg-success-soft-bg border-olive-200',
  icon: 'text-success-text',
  title: 'text-olive-800',
  text: 'text-success-text',
  deleteHoverBg: 'hover:bg-ok-bg',
};

// bare, not ghost: the ghost variant carries its own olive text colour, which competes with the
// banner's register in the stylesheet and wins regardless of the order these classes are written in
const ACTION_STYLE = { padding: '7px 10px', fontSize: '12.5px', gap: '7px' };

const formatDate = (date: string) => format(parseISO(date), 'dd/MM/yyyy');

export function QueuedRenewalNotice({ renewal, isPaused, onDelete, onAssignStartDate }: Props) {
  const styles = isPaused ? PAUSED_STYLES : QUEUED_STYLES;
  const { startDate, contractEndDate } = renewal;
  const dates = startDate && contractEndDate ? { startDate, contractEndDate } : null;

  const pausedTitle = dates
    ? 'Plan en pausa · renovación registrada'
    : 'Plan en pausa · renovación sin fecha de inicio';
  const queuedTitle = dates
    ? `Renovación registrada · inicia el ${formatDate(dates.startDate)}`
    : 'Renovación registrada · sin fecha de inicio';
  const title = isPaused ? pausedTitle : queuedTitle;

  return (
    <div className={`flex items-start gap-3 border rounded-md px-[18px] py-3.5 mb-5 ${styles.box}`}>
      <Icon name="refresh" size={16} className={`${styles.icon} shrink-0 mt-[2px]`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold ${styles.title}`}>{title}</p>
        <p className={`font-mono text-[11px] tabular-nums mt-[3px] ${styles.text}`}>
          {formatRenewalMeta(renewal)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {!dates && (
          <Button
            variant="bare"
            onClick={onAssignStartDate}
            leftIcon="calendar"
            className={`font-semibold rounded-lg ${styles.title}`}
            style={ACTION_STYLE}
          >
            Asignar fecha de inicio
          </Button>
        )}
        <Button
          variant="bare"
          onClick={onDelete}
          leftIcon="trash"
          className={`font-semibold rounded-lg ${styles.text} ${styles.deleteHoverBg}`}
          style={ACTION_STYLE}
        >
          Eliminar renovación
        </Button>
      </div>
    </div>
  );
}
