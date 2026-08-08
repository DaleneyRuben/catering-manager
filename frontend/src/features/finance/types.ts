export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
  // A category archived after this month was spent still owns the money, so the line stays and is
  // tagged rather than dropped.
  active: boolean;
}

export interface MovementFilters {
  q: string;
  // 'all' is the absence of a filter, not a value the API understands — it is dropped from the
  // query rather than sent.
  direction: 'all' | 'income' | 'expense';
  categoryId: string;
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
  // The month's truth. These never narrow — a "Balance" of one category is not a balance of
  // anything, so the tiles stay put and only the list below responds to a filter.
  income: number;
  expenses: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  byCategory: CategoryTotal[];
  // The list, and the count and signed subtotal underneath it. All three carry the filters, so
  // with none active the subtotal equals the balance above.
  movements: Movement[];
  count: number;
  subtotal: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  active: boolean;
}

// What the management modal reads: the counts let a row state its own usage before anyone
// archives it, and they are the order the server already sorted the catalog by.
export interface ExpenseCategoryWithUsage extends ExpenseCategory {
  usageThisMonth: number;
  usageAllTime: number;
}

export interface ExpenseInput {
  amount: number;
  categoryId: string;
  spentAt: string;
  description?: string | null;
}
