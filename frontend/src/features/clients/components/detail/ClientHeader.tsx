import { differenceInYears, format, parseISO, startOfToday } from 'date-fns';
import { Icon } from '@ui/Icon';
import { Button } from '@ui/Button';
import { OverflowMenu } from '@ui/OverflowMenu';
import { Tooltip } from '@ui/Tooltip';
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  STATUS_DOT_CLASSES,
  CLIENT_STATUS,
} from '@/features/clients/constants/clientStatus';
import { SEX_LABELS } from '@/features/clients/constants/clientOptions';
import { findQueuedRenewal, hasUpcomingSubscription } from '@/features/clients/utils/queuedRenewal';
import { initials } from '@/utils/string';
import type { Client, ClientStatus } from '@/features/clients/types';
import { QueuedRenewalNotice } from './QueuedRenewalNotice';

const OUTLINE_BTN_CLS = 'bg-paper border border-rule hover:border-rule-2';
const OUTLINE_OLIVE_BTN_CLS = 'bg-paper border border-olive-200 text-olive-700 hover:bg-olive-100';
const PAUSE_BTN_STYLE = {
  padding: '10px 16px',
  fontSize: '13px',
  gap: '8px',
  color: 'var(--color-ink-2)',
};
const RESUME_BTN_STYLE = { padding: '10px 18px', fontSize: '13px', gap: '8px' };
const RENEW_BTN_STYLE = { padding: '10px 16px', fontSize: '13px', gap: '8px' };

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
  onDeleteRenewal: () => void;
  onAssignStartDate: () => void;
}

const RENEWAL_BLOCKED_REASON =
  'Renovar está inactivo: un cliente puede tener una sola renovación pendiente. Elimina la renovación registrada si necesitas registrarla de nuevo.';
const NOT_STARTED_REASON = 'Renovar está inactivo hasta que el plan esté en curso.';
const UNPAID_RENEWAL_BLOCKED_REASON =
  'Ya hay una renovación registrada pendiente de pago. Gestiónala desde Evaluaciones → Pendientes de pago.';

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
  onDeleteRenewal,
  onAssignStartDate,
}: Props) {
  const age = differenceInYears(startOfToday(), parseISO(client.dateOfBirth));
  const sub = client.subscriptions[0];
  const queuedRenewal = findQueuedRenewal(client.subscriptions);
  // Payment-agnostic on purpose: a client can only have one upcoming subscription registered at
  // a time, paid or not — an unpaid one still occupies the slot, it just isn't shown in detail
  // (see queuedRenewal.ts).
  const upcomingRenewalBlocked = hasUpcomingSubscription(client.subscriptions);
  const unpaidRenewalPending = upcomingRenewalBlocked && !queuedRenewal;
  // a Programado client's own plan is already the one upcoming subscription they are allowed
  const notStartedReason = status === CLIENT_STATUS.FUTURE ? NOT_STARTED_REASON : null;
  let renewalBlockedReason = notStartedReason;
  if (queuedRenewal) renewalBlockedReason = RENEWAL_BLOCKED_REASON;
  else if (unpaidRenewalPending) renewalBlockedReason = UNPAID_RENEWAL_BLOCKED_REASON;

  let toggleConfig: { label: string; icon: 'calendar' | 'check'; className?: string } | null = null;
  if (status === CLIENT_STATUS.ACTIVE || status === CLIENT_STATUS.EXPIRING) {
    toggleConfig = { label: 'Pausar', icon: 'calendar', className: OUTLINE_BTN_CLS };
  } else if (status === CLIENT_STATUS.PAUSED) {
    toggleConfig = { label: 'Reanudar', icon: 'check' };
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={onBack}
        leftIcon="arrow-left"
        className="font-mono uppercase tracking-[.08em] hover:underline mb-5"
        style={{ padding: 0, fontSize: '11px', gap: '7px' }}
      >
        Clientes
      </Button>

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
              style={status === CLIENT_STATUS.PAUSED ? RESUME_BTN_STYLE : PAUSE_BTN_STYLE}
            >
              {toggleConfig.label}
            </Button>
          )}
          {renewalBlockedReason ? (
            <Tooltip content={renewalBlockedReason} align="end">
              <Button
                variant="secondary"
                onClick={onRenew}
                leftIcon="refresh"
                disabled
                className={OUTLINE_BTN_CLS}
                style={RENEW_BTN_STYLE}
              >
                {status === CLIENT_STATUS.ENDED ? 'Reactivar' : 'Renovar'}
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="secondary"
              onClick={onRenew}
              leftIcon="refresh"
              className={OUTLINE_OLIVE_BTN_CLS}
              style={RENEW_BTN_STYLE}
            >
              {status === CLIENT_STATUS.ENDED ? 'Reactivar' : 'Renovar'}
            </Button>
          )}
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

      {queuedRenewal && (
        <QueuedRenewalNotice
          renewal={queuedRenewal}
          isPaused={status === CLIENT_STATUS.PAUSED}
          onDelete={onDeleteRenewal}
          onAssignStartDate={onAssignStartDate}
        />
      )}
      {!queuedRenewal && unpaidRenewalPending && (
        <div className="flex items-center gap-2.5 bg-warn-bg border border-warn-border rounded-md px-3.5 py-3 mb-5">
          <Icon name="refresh" size={14} className="text-warn shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-warn-text-strong">
              Renovación pendiente de pago
            </p>
            <p className="font-mono text-[11px] text-warn-text">
              Este cliente tiene una renovación registrada sin confirmar el pago. Gestiónala desde
              Evaluaciones → Pendientes de pago.
            </p>
          </div>
        </div>
      )}
      {!queuedRenewal && !unpaidRenewalPending && status === CLIENT_STATUS.PAUSED && (
        <div className="flex items-center gap-2.5 bg-warn-bg border border-warn-border rounded-md px-3.5 py-3 mb-5">
          <Icon name="calendar" size={14} className="text-warn shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-warn-text-strong">Plan en pausa</p>
            <p className="font-mono text-[11px] text-warn-text">
              El cliente no recibe entregas. Reanuda el plan cuando esté listo.
            </p>
          </div>
        </div>
      )}
      {status === CLIENT_STATUS.FUTURE && sub?.startDate && (
        <div className="flex items-center gap-2.5 bg-warn-bg border border-warn-border rounded-md px-3.5 py-3 mb-5">
          <Icon name="calendar" size={14} className="text-warn shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-warn-text-strong">Plan programado</p>
            <p className="font-mono text-[11px] text-warn-text">
              El plan inicia el {format(parseISO(sub.startDate), 'dd/MM/yyyy')}.
            </p>
            <p className="text-[12.5px] text-warn-text mt-[5px]">{NOT_STARTED_REASON}</p>
          </div>
        </div>
      )}
    </>
  );
}
