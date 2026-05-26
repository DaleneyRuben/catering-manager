export const MEAL_KEYS = [
  'breakfast',
  'morning_snack',
  'salad',
  'lunch',
  'afternoon_snack',
  'dinner',
  'juice',
  'extra',
] as const;

export type MealKey = (typeof MEAL_KEYS)[number];

export const MEAL_LABELS: Record<MealKey, string> = {
  breakfast: 'Desayuno',
  morning_snack: 'Merienda AM',
  salad: 'Ensalada',
  lunch: 'Almuerzo',
  afternoon_snack: 'Merienda PM',
  dinner: 'Cena',
  juice: 'Jugo',
  extra: 'Extra',
};

export interface PlanDraft {
  name: string;
  meals: MealKey[];
  price: string;
}

const HALF = Math.ceil(MEAL_KEYS.length / 2);
export const COL1 = MEAL_KEYS.slice(0, HALF);
export const COL2 = MEAL_KEYS.slice(HALF);
