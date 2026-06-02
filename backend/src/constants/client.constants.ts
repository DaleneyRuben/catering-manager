export const ZONES = ['Centro', 'Sur'] as const;
export const DELIVERIES = ['La Oliva', 'Otro'] as const;
export const SEX_OPTIONS = ['male', 'female', 'other'] as const;

export type Zone = (typeof ZONES)[number];
export type Delivery = (typeof DELIVERIES)[number];
export type SexOption = (typeof SEX_OPTIONS)[number];
