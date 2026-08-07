import { QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize';
import { monthBounds } from './_helpers';

type TotalRow = { total: string };
type CategoryRow = { categoryId: number; categoryName: string; total: string };

export type MonthSummary = {
  income: number;
  expenses: number;
  balance: number;
  byCategory: { categoryId: number; categoryName: string; total: number }[];
};

// Cash basis: both sides are filtered by the day the money moved, never the period it relates to.
// Totals are summed with SUM(amount) rather than by reducing rows in JS — pg returns DECIMAL as a
// string, and JS float addition over a few hundred rows drifts (ADR-008).
export const findMonthSummary = async (month: string): Promise<MonthSummary> => {
  const replacements = monthBounds(month);

  const [incomeRows, expenseRows, categoryRows] = await Promise.all([
    sequelize.query<TotalRow>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM payments
       WHERE "paidAt" BETWEEN :start AND :end`,
      { replacements, type: QueryTypes.SELECT },
    ),
    sequelize.query<TotalRow>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE "deletedAt" IS NULL
         AND "spentAt" BETWEEN :start AND :end`,
      { replacements, type: QueryTypes.SELECT },
    ),
    sequelize.query<CategoryRow>(
      `SELECT c.id AS "categoryId", c.name AS "categoryName", SUM(e.amount) AS total
       FROM expenses e
       JOIN expense_categories c ON c.id = e."categoryId"
       WHERE e."deletedAt" IS NULL
         AND e."spentAt" BETWEEN :start AND :end
       GROUP BY c.id, c.name
       ORDER BY total DESC`,
      { replacements, type: QueryTypes.SELECT },
    ),
  ]);

  const income = Number(incomeRows[0].total);
  const expenses = Number(expenseRows[0].total);

  return {
    income,
    expenses,
    balance: income - expenses,
    byCategory: categoryRows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      total: Number(row.total),
    })),
  };
};
