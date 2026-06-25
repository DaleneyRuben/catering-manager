import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ActiveClientRow } from '../services/report.service';

export type MenuData = {
  breakfast: string | null;
  morningSnack: string | null;
  salad: string | null;
  lunch: string | null;
  afternoonSnack: string | null;
  dinner: string | null;
  juice: string | null;
};

export type MealKey =
  | 'breakfast'
  | 'morning_snack'
  | 'salad'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner';

export type MealConfig = {
  key: MealKey;
  label: string;
  menuField: keyof MenuData;
};

export type MealSection = {
  label: string;
  dish: string;
  count: number;
  noDar: string[];
  // instruction label → client names (e.g. "DAR GRANDES" → ["Ana López", "Carlos Ríos"])
  instructions: Record<string, string[]>;
};

export type KitchenReportData = {
  dateText: string;
  totalClients: number;
  pasteleria: MealSection[];
  hiperproteico: string[];
  produccion: MealSection[];
};

export const PASTELERIA_MEALS: MealConfig[] = [
  { key: 'breakfast', label: 'DESAYUNO', menuField: 'breakfast' },
  { key: 'morning_snack', label: 'MEDIA MAÑANA', menuField: 'morningSnack' },
  { key: 'afternoon_snack', label: 'MERIENDA TARDE', menuField: 'afternoonSnack' },
];

export const PRODUCCION_MEALS: MealConfig[] = [
  { key: 'lunch', label: 'ALMUERZO', menuField: 'lunch' },
  { key: 'salad', label: 'ENSALADA', menuField: 'salad' },
  { key: 'dinner', label: 'CENA', menuField: 'dinner' },
];

const formatDateText = (date: string): string => {
  const parsed = parseISO(date);
  const day = format(parsed, 'dd');
  const month = format(parsed, 'MMMM', { locale: es }).toUpperCase();
  const year = format(parsed, 'yyyy');
  return `FECHA: ${day} – ${month} – ${year}`;
};

const groupByInstruction = (
  mealKey: string,
  receiving: ActiveClientRow[],
): Record<string, string[]> =>
  receiving.reduce<Record<string, string[]>>((acc, c) => {
    const label = c.specialInstructions[mealKey];
    if (label) {
      acc[label] = [...(acc[label] ?? []), c.name];
    }
    return acc;
  }, {});

const toSection = (
  configs: MealConfig[],
  menu: MenuData,
  clients: ActiveClientRow[],
): MealSection[] =>
  configs.map((m) => {
    const receiving = clients.filter((c) => c.planMeals.includes(m.key));
    return {
      label: m.label,
      dish: menu[m.menuField] ?? '',
      count: receiving.length,
      noDar: clients.filter((c) => !c.planMeals.includes(m.key)).map((c) => c.name),
      instructions: groupByInstruction(m.key, receiving),
    };
  });

export const computeKitchenReportData = (
  menu: MenuData,
  clients: ActiveClientRow[],
  date: string,
): KitchenReportData => ({
  dateText: formatDateText(date),
  totalClients: clients.length,
  pasteleria: toSection(PASTELERIA_MEALS, menu, clients),
  hiperproteico: clients.filter((c) => c.planMeals.includes('extra')).map((c) => c.name),
  produccion: toSection(PRODUCCION_MEALS, menu, clients),
});

export const kitchenReportFileName = (date: string): string => {
  const parsed = parseISO(date);
  const dayName = format(parsed, 'EEEE', { locale: es });
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalized} ${format(parsed, 'dd-MM')}.docx`;
};
