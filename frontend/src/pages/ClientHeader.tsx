import { differenceInYears, parseISO, startOfToday } from 'date-fns';
import { Icon } from '../components/ui/Icon';
import { STATUS_LABELS, STATUS_CLASSES, CLIENT_STATUS } from '../constants/clientStatus';
import { SEX_LABELS } from '../constants/clientOptions';
import { initials } from '../utils/string';
import type { Client, ClientStatus } from '../types/client';

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
            <button
              type="button"
              onClick={onToggleActive}
              disabled={isUpdating}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${toggleConfig.className}`}
            >
              {isUpdating ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name={toggleConfig.icon} size={14} />
              )}
              {toggleConfig.label}
            </button>
          )}
          <button
            type="button"
            onClick={onRenew}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
          >
            <Icon name="refresh" size={14} />
            Renovar
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors"
          >
            <Icon name="settings" size={14} />
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border border-[#e9c4bb] rounded-md text-alert hover:bg-cream-2 transition-colors"
          >
            Eliminar
          </button>
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
    </>
  );
}
