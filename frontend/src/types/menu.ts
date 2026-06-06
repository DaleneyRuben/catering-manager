export interface Menu {
  id: number;
  date: string;
  breakfast: string | null;
  morningSnack: string | null;
  salad: string | null;
  lunch: string | null;
  afternoonSnack: string | null;
  dinner: string | null;
  juice: string | null;
}

export type MenuDraft = Omit<Menu, 'id'>;
