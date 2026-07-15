export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  KITCHEN: 'kitchen',
  DELIVERY: 'delivery',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN] as const;

export const isAdminRole = (role: UserRole | undefined): boolean =>
  role !== undefined && (ADMIN_ROLES as readonly UserRole[]).includes(role);

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLES.SUPER_ADMIN]: 'Super admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.KITCHEN]: 'Cocina',
  [ROLES.DELIVERY]: 'Delivery',
};
