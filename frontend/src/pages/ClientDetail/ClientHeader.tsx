import { differenceInYears, format, parseISO, startOfToday } from 'date-fns';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { STATUS_LABELS, STATUS_CLASSES, CLIENT_STATUS } from '../../constants/clientStatus';
import { SEX_LABELS } from '../../constants/clientOptions';
import { initials } from '../../utils/string';
import type { Client, ClientStatus } from '../../types/client';

interface Props {
  client: Client;
  status: ClientStatus;
  isUpdating: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onRenew: () => void;
}

export function ClientHeader({
  client,
  status,
  isUpdating,
  onToggleActive,
  onEdit,
  onDelete,
  onBack,
  onRenew,
}: Props) {
  const age = differenceInYears(startOfToday(), parseISO(client.dateOfBirth));
  const sub = client.subscriptions[0];

  let toggleConfig: { label: string; icon: 'calendar' | 'check'; className: string } | null = null;
  if (status === CLIENT_STATUS.ACTIVE || status === CLIENT_STATUS.EXPIRING) {
    toggleConfig = {
      label: 'Pausar',
      icon: 'calendar',
      className: 'border border-rule text-ink hover:bg-cream-2',
    };
  } else if (status === CLIENT_STATUS.PAUSED) {
    toggleConfig = {
      label: 'Reanudar',
      icon: 'check',
      className: 'bg-olive-800 text-white hover:bg-olive-700',
    };
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink mb-5 transition-colors"
      >
        <Icon name="arrow-left" size={13} />
        Clientes
      </button>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-olive-800 text-white flex items-center justify-center font-serif text-[26px] font-semibold shrink-0">
          {initials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-[36px] leading-none text-ink">{client.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono ${STATUS_CLASSES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="font-mono text-[12px] text-muted mt-1.5">
            {age} años · {SEX_LABELS[client.sex] ?? client.sex} · {client.deliveryZone} ·{' '}
            {client.phoneNumber}
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {toggleConfig && (
            <Button
              variant={status === CLIENT_STATUS.PAUSED ? 'primary' : 'secondary'}
              onClick={onToggleActive}
              disabled={isUpdating}
              loading={isUpdating}
              leftIcon={toggleConfig.icon}
            >
              {toggleConfig.label}
            </Button>
          )}
          <Button variant="secondary" onClick={onRenew} leftIcon="refresh">
            {status === CLIENT_STATUS.ENDED ? 'Reactivar' : 'Renovar'}
          </Button>
          <Button onClick={onEdit} leftIcon="settings">
            Editar
          </Button>
          <Button variant="alert" onClick={onDelete}>
            Eliminar
          </Button>
        </div>
      </div>

      {status === CLIENT_STATUS.PAUSED && (
        <div className="flex items-center gap-2.5 bg-[#f3eedc] border border-[#d8c075] rounded-md px-3.5 py-3 mb-5">
          <Icon name="calendar" size={14} className="text-[#6b4f08] shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#6b4f08]">Plan en pausa</p>
            <p className="font-mono text-[11px] text-[#6b4f08]">
              El cliente no recibe entregas. Reanudá el plan cuando esté listo.
            </p>
          </div>
        </div>
      )}
      {status === CLIENT_STATUS.FUTURE && sub?.startDate && (
        <div className="flex items-center gap-2.5 bg-[#f3eedc] border border-[#d8c075] rounded-md px-3.5 py-3 mb-5">
          <Icon name="calendar" size={14} className="text-[#6b4f08] shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#6b4f08]">Plan programado</p>
            <p className="font-mono text-[11px] text-[#6b4f08]">
              El plan inicia el {format(parseISO(sub.startDate), 'dd/MM/yyyy')}.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
