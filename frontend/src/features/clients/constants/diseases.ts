export const DISEASES = [
  'Diabetes',
  'Hipertensión',
  'Sobrepeso',
  'Gastritis',
  'Celíaco',
  'Intolerancia a la lactosa',
  'Enfermedad renal',
  'Anemia',
  'Postoperatorias',
  'Adulto mayor',
] as const;

export type Disease = (typeof DISEASES)[number];
