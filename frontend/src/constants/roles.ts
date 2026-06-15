export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DELIVERY: 'delivery',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
