export const ZONES = ['Centro', 'Sur'] as const;
export const DELIVERIES = ['La Oliva', 'Otro'] as const;

export const SEX_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
] as const;

export const SEX_LABELS: Record<string, string> = Object.fromEntries(
  SEX_OPTIONS.map((o) => [o.value, o.label]),
);
