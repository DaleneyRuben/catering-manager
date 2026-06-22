export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  KITCHEN: 'kitchen',
  DELIVERY: 'delivery',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
