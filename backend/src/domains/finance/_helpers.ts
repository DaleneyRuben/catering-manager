import { endOfMonth, format, parseISO } from 'date-fns';
import { col, fn, where, type WhereOptions } from 'sequelize';
import { foldAccents, likePattern } from '../../utils/search';

// A month is addressed as 'YYYY-MM' and resolved to inclusive day bounds, so every query filters
// on a DATEONLY range rather than extracting parts of the column.
export const monthBounds = (month: string): { start: string; end: string } => {
  const start = `${month}-01`;
  return { start, end: format(endOfMonth(parseISO(`${start}T12:00:00`)), 'yyyy-MM-dd') };
};

export type MovementFilters = {
  direction?: 'income' | 'expense';
  categoryId?: number;
  q?: string;
};

// Folds case and accents so "verduleria" finds "verdulería". translate() rather than the unaccent
// extension: no migration, nothing to install on the database, and the lost index does not matter
// over one month of rows. Must mirror foldAccents() in utils/search, which folds the search term.
//
// Exported as the two arguments as well as the ready-made SQL, because the category name match
// builds the same fold through Sequelize's fn() rather than as a string — one accent list, so a
// search and a duplicate-name check can never disagree about what counts as the same word.
export const ACCENTED = 'áéíóúüñ';
export const UNACCENTED = 'aeiouun';

export const folded = (expr: string) => `translate(lower(${expr}), '${ACCENTED}', '${UNACCENTED}')`;

// Matches a category by name the way a person reads one: "INSUMOS", "insumos" and "Ínsumos" are
// all the same category, so typing any of them into "+ Nueva" finds the one that exists rather
// than filing a second row beside it.
export const sameName = (name: string): WhereOptions =>
  where(fn('translate', fn('lower', col('name')), ACCENTED, UNACCENTED), foldAccents(name));

// The month bounds and filter predicates for each half of the stream, shared by the row query and
// the subtotal so the list and the figure below it can never disagree about what is in scope.
export const movementScope = (month: string, filters: MovementFilters = {}) => {
  const replacements: Record<string, unknown> = { ...monthBounds(month) };
  const incomeWhere = ['p."paidAt" BETWEEN :start AND :end'];
  const expenseWhere = ['e."deletedAt" IS NULL', 'e."spentAt" BETWEEN :start AND :end'];

  if (filters.categoryId !== undefined) {
    expenseWhere.push('e."categoryId" = :categoryId');
    replacements.categoryId = filters.categoryId;
  }

  if (filters.q) {
    replacements.q = likePattern(filters.q);
    incomeWhere.push(`${folded('c.name')} LIKE :q`);
    expenseWhere.push(`${folded('e.description')} LIKE :q`);
  }

  return {
    // Income carries no category, so asking for one is an expenses-only question. The UI keeps the
    // two controls consistent, but the query must not answer with payments regardless.
    includeIncome: filters.direction !== 'expense' && filters.categoryId === undefined,
    includeExpense: filters.direction !== 'income',
    incomeWhere: incomeWhere.join('\n       AND '),
    expenseWhere: expenseWhere.join('\n       AND '),
    replacements,
  };
};
