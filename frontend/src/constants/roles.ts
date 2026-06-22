export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  KITCHEN: 'kitchen',
  DELIVERY: 'delivery',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLES.SUPER_ADMIN]: 'Super admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.KITCHEN]: 'Cocina',
  [ROLES.DELIVERY]: 'Delivery',
};
