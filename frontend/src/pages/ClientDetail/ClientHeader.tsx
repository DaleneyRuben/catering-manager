import { differenceInYears, format, parseISO, startOfToday } from 'date-fns';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { OverflowMenu } from '../../components/ui/OverflowMenu';
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  STATUS_DOT_CLASSES,
  CLIENT_STATUS,
} from '../../constants/clientStatus';
import { SEX_LABELS } from '../../constants/clientOptions';
import { initials } from '../../utils/string';
import type { Client, ClientStatus } from '../../types/client';

const OUTLINE_BTN_CLS = 'bg-paper border border-rule text-ink hover:bg-cream-2';
const OUTLINE_OLIVE_BTN_CLS = 'bg-paper border border-olive-200 text-olive-700 hover:bg-olive-100';

interface Props {
  client: Client;
  status: ClientStatus;
  isUpdating: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFinalize: () => void;
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
  onFinalize,
  onBack,
  onRenew,
}: Props) {
  const age = differenceInYears(startOfToday(), parseISO(client.dateOfBirth));
  const sub = client.subscriptions[0];

  let toggleConfig: { label: string; icon: 'calendar' | 'check'; className?: string } | null = null;
  if (status === CLIENT_STATUS.ACTIVE || status === CLIENT_STATUS.EXPIRING) {
    toggleConfig = { label: 'Pausar', icon: 'calendar', className: OUTLINE_BTN_CLS };
  } else if (status === CLIENT_STATUS.PAUSED) {
    toggleConfig = { label: 'Reanudar', icon: 'check' };
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

      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 lg:w-[62px] lg:h-[62px] rounded-full bg-olive-800 text-white flex items-center justify-center font-serif text-[20px] lg:text-[24px] font-semibold shrink-0">
            {initials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-[24px] lg:text-[35px] font-semibold leading-none tracking-[.005em] text-ink">
                {client.name}
              </h1>
              <span
                className={`inline-flex items-center gap-[7px] pl-[10px] pr-3 py-[5px] rounded-full text-[12px] font-semibold ${STATUS_CLASSES[status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_CLASSES[status]}`} />
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="font-mono text-[11.5px] tracking-[.04em] text-faint mt-[9px]">
              {age} años · {SEX_LABELS[client.sex] ?? client.sex} · {client.deliveryZone} ·{' '}
              {client.phoneNumber}
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          {toggleConfig && (
            <Button
              variant={status === CLIENT_STATUS.PAUSED ? 'primary' : 'secondary'}
              onClick={onToggleActive}
              disabled={isUpdating}
              loading={isUpdating}
              leftIcon={toggleConfig.icon}
              className={toggleConfig.className}
            >
              {toggleConfig.label}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onRenew}
            leftIcon="refresh"
            className={OUTLINE_OLIVE_BTN_CLS}
          >
            {status === CLIENT_STATUS.ENDED ? 'Reactivar' : 'Renovar'}
          </Button>
          <OverflowMenu
            items={[
              { label: 'Editar datos', icon: 'pencil', onClick: onEdit },
              ...(status !== CLIENT_STATUS.ENDED
                ? [
                    {
                      label: 'Finalizar plan',
                      icon: 'x',
                      onClick: onFinalize,
                      variant: 'alert' as const,
                    },
                  ]
                : []),
              { label: 'Eliminar', icon: 'trash', onClick: onDelete, variant: 'alert' },
            ]}
          />
        </div>
      </div>

      {status === CLIENT_STATUS.PAUSED && (
        <div className="flex items-center gap-2.5 bg-warn-bg border border-warn-border rounded-md px-3.5 py-3 mb-5">
          <Icon name="calendar" size={14} className="text-warn shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-warn">Plan en pausa</p>
            <p className="font-mono text-[11px] text-warn">
              El cliente no recibe entregas. Reanudá el plan cuando esté listo.
            </p>
          </div>
        </div>
      )}
      {status === CLIENT_STATUS.FUTURE && sub?.startDate && (
        <div className="flex items-center gap-2.5 bg-warn-bg border border-warn-border rounded-md px-3.5 py-3 mb-5">
          <Icon name="calendar" size={14} className="text-warn shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-warn">Plan programado</p>
            <p className="font-mono text-[11px] text-warn">
              El plan inicia el {format(parseISO(sub.startDate), 'dd/MM/yyyy')}.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
