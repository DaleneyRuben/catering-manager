import type { ClientStatus } from '../types/client';

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  expiring: 'Por vencer',
  ended: 'Finalizado',
};

export const STATUS_CLASSES: Record<ClientStatus, string> = {
  active: 'bg-ok-bg text-ok',
  paused: 'bg-warn-bg text-warn',
  expiring: 'bg-warn-bg text-warn',
  ended: 'bg-rule text-muted',
};
