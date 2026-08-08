import { QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize';
import { appToday } from '../../utils/date';
import { monthBounds } from './_helpers';

type CategoryFilter = {
  includeInactive?: boolean;
  // Which month "used this month" counts against. Defaults to the current one; the categories
  // modal passes the month being viewed so its usage lines describe the register on screen.
  month?: string;
};

type CategoryRow = {
  id: number;
  name: string;
  active: boolean;
  usageThisMonth: string;
  usageAllTime: string;
};

export type CategoryWithUsage = Omit<CategoryRow, 'usageThisMonth' | 'usageAllTime'> & {
  usageThisMonth: number;
  usageAllTime: number;
};

// LEFT JOIN, not INNER: a category created a moment ago has no expenses and must still come back —
// it is the one the user is about to file against. Deleted expenses are excluded in the join
// condition rather than the WHERE, which would turn the outer join back into an inner one.
//
// The order is the chip row's order (business-rules.md → Finanzas), decided here rather than in
// the client so the form and the modal cannot disagree: what the user reaches for most comes first,
// all-time use breaks the tie, name settles the rest. "Otros" is pinned last whatever its count —
// it is where unclassified spending lands, so ranking it by use would float the least informative
// chip to the front. false sorts before true in Postgres, so the equality test does the pinning.
const categoriesQuery = (where: string) => `
    SELECT c.id, c.name, c.active,
           COUNT(e.id) FILTER (WHERE e."spentAt" BETWEEN :start AND :end) AS "usageThisMonth",
           COUNT(e.id) AS "usageAllTime"
    FROM expense_categories c
    LEFT JOIN expenses e ON e."categoryId" = c.id AND e."deletedAt" IS NULL
    ${where}
    GROUP BY c.id, c.name, c.active
    ORDER BY lower(c.name) = 'otros',
             "usageThisMonth" DESC,
             "usageAllTime" DESC,
             c.name ASC`;

export const findCategories = async ({
  includeInactive = false,
  month,
}: CategoryFilter = {}): Promise<CategoryWithUsage[]> => {
  const rows = await sequelize.query<CategoryRow>(
    categoriesQuery(includeInactive ? '' : 'WHERE c.active = true'),
    {
      replacements: monthBounds(month ?? appToday().slice(0, 7)),
      type: QueryTypes.SELECT,
    },
  );

  // pg returns COUNT as a bigint, which arrives as a string — the same trap as the DECIMAL totals.
  return rows.map((row) => ({
    ...row,
    usageThisMonth: Number(row.usageThisMonth),
    usageAllTime: Number(row.usageAllTime),
  }));
};
