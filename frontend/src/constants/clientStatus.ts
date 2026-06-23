import type { ClientStatus } from '../types/client';

export const CLIENT_STATUS = {
  ACTIVE: 'active',
  EXPIRING: 'expiring',
  PAUSED: 'paused',
  SUSPENDED: 'suspended',
  ENDED: 'ended',
  FUTURE: 'future',
  ALL: 'all',
} as const;

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  expiring: 'Por vencer',
  suspended: 'Suspendido',
  ended: 'Finalizado',
  future: 'Programado',
};

export const STATUS_CLASSES: Record<ClientStatus, string> = {
  active: 'bg-ok-bg text-ok',
  paused: 'bg-cream-2 text-muted',
  expiring: 'bg-warn-bg text-warn',
  suspended: 'bg-cream-2 text-muted',
  ended: 'bg-cream-2 text-faint',
  future: 'bg-olive-100 text-olive-600',
};

export const STATUS_DOT_CLASSES: Record<ClientStatus, string> = {
  active: 'bg-ok',
  paused: 'bg-muted-dot',
  expiring: 'bg-warn-dot',
  suspended: 'bg-muted-dot',
  ended: 'bg-rule-2',
  future: 'bg-olive-400',
};
