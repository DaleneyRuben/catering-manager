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
  paused: 'bg-alert-bg text-alert',
  expiring: 'bg-warn-bg text-warn',
  suspended: 'bg-warn-bg text-warn',
  ended: 'bg-alert-bg text-alert',
  future: 'bg-warn-bg text-warn',
};
