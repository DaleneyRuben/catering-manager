import { MEAL_LABELS } from '@/constants/meals';
import type { MenuDraft } from '@/features/menu/types';

export const MEAL_FIELDS = [
  'breakfast',
  'morningSnack',
  'salad',
  'lunch',
  'afternoonSnack',
  'dinner',
  'juice',
] as const;

export type MealField = (typeof MEAL_FIELDS)[number];

export const MEAL_FIELD_LABELS: Record<MealField, string> = {
  breakfast: MEAL_LABELS.breakfast,
  morningSnack: MEAL_LABELS.morning_snack,
  salad: MEAL_LABELS.salad,
  lunch: MEAL_LABELS.lunch,
  afternoonSnack: MEAL_LABELS.afternoon_snack,
  dinner: MEAL_LABELS.dinner,
  juice: MEAL_LABELS.juice,
};

export const emptyDraft = (date: string): MenuDraft => ({
  date,
  breakfast: null,
  morningSnack: null,
  salad: null,
  lunch: null,
  afternoonSnack: null,
  dinner: null,
  juice: null,
});
