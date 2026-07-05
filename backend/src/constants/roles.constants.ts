export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  KITCHEN: 'kitchen',
  DELIVERY: 'delivery',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES = Object.values(ROLES) as [UserRole, ...UserRole[]];
