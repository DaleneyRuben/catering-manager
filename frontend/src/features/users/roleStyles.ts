import type { UserRole } from '@/features/auth/AuthContext';

export const ROLE_CLASSES: Record<UserRole, string> = {
  super_admin: 'bg-ok-bg text-ok',
  admin: 'bg-olive-100 text-olive-700',
  kitchen: 'bg-warn-bg text-warn',
  delivery: 'bg-taupe-bg text-taupe',
};

// Super admin's avatar/icon uses a darker olive than its badge text — every other role reuses ROLE_CLASSES as-is.
export const ROLE_ICON_CLASSES: Record<UserRole, string> = {
  ...ROLE_CLASSES,
  super_admin: 'bg-ok-bg text-olive-800',
};
