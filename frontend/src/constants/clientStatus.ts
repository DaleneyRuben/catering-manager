import type { ClientStatus } from '../types/client';

export const CLIENT_STATUS = {
  ACTIVE: 'active',
  EXPIRING: 'expiring',
  PAUSED: 'paused',
  SUSPENDED: 'suspended',
  ENDED: 'ended',
  ALL: 'all',
} as const;

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  expiring: 'Por vencer',
  suspended: 'Suspendido',
  ended: 'Finalizado',
};

export const STATUS_CLASSES: Record<ClientStatus, string> = {
  active: 'bg-ok-bg text-ok',
  paused: 'bg-warn-bg text-warn',
  expiring: 'bg-warn-bg text-warn',
  suspended: 'bg-warn-bg text-warn',
  ended: 'bg-alert-bg text-alert',
};
