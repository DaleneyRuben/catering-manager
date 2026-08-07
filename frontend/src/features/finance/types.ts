export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface Movement {
  kind: 'income' | 'expense';
  id: string;
  date: string;
  amount: number;
  // Client name for income, category name for an expense.
  label: string;
  description: string | null;
}

export interface FinanceOverview {
  month: string;
  // The floor of the month selector, owned by the server: there is no data before the register
  // went live and no backfill.
  earliestMonth: string;
  income: number;
  expenses: number;
  balance: number;
  byCategory: CategoryTotal[];
  movements: Movement[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface ExpenseInput {
  amount: number;
  categoryId: string;
  spentAt: string;
  description?: string | null;
}
