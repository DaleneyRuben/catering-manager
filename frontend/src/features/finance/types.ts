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
  // Set on income only — an expense is not attached to anyone. The row links to this client
  // unless they have been archived, in which case the name is marked and leads nowhere.
  clientId: string | null;
  clientArchived: boolean;
  // Set on expenses only; the row's category tag filters the list by it.
  categoryId: string | null;
  // Provenance. Null when the user who registered the row has since been deleted.
  registeredByName: string | null;
  // When the row was entered, which is not the day it is dated when an expense is backdated.
  registeredAt: string;
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
