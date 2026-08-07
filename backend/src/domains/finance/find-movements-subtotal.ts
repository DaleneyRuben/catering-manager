import { QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize';
import { movementScope, type MovementFilters } from './_helpers';

type SubtotalRow = { count: string; subtotal: string };

export type MovementSubtotal = { count: number; subtotal: number };

// The clients join is carried even though no client column is selected: a search term matches an
// income row by the client's name, so the filter needs the table.
const incomeSource = (where: string) => `
    SELECT p.amount AS signed
    FROM payments p
    JOIN clients c ON c.id = p."clientId"
    WHERE ${where}`;

const expenseSource = (where: string) => `
    SELECT -e.amount AS signed
    FROM expenses e
    WHERE ${where}`;

// The figure under the filtered list, answering "how much did we spend on Transporte this month?".
// It is signed the same way the tiles are, so with no filter active it equals the month's balance —
// which is what lets the three tiles stay fixed at the month's truth while the list moves.
//
// Summed in SQL, never by reducing rows in JS: pg returns DECIMAL as a string and float addition
// over a few hundred rows drifts (ADR-008). That applies to a filtered subtotal exactly as it does
// to a month total.
export const findMovementsSubtotal = async (
  month: string,
  filters: MovementFilters = {},
): Promise<MovementSubtotal> => {
  const scope = movementScope(month, filters);

  const branches = [
    ...(scope.includeIncome ? [incomeSource(scope.incomeWhere)] : []),
    ...(scope.includeExpense ? [expenseSource(scope.expenseWhere)] : []),
  ];

  const rows = await sequelize.query<SubtotalRow>(
    `SELECT COUNT(*) AS count, COALESCE(SUM(signed), 0) AS subtotal
     FROM (${branches.join('\n    UNION ALL')}) movements`,
    { replacements: scope.replacements, type: QueryTypes.SELECT },
  );

  return { count: Number(rows[0].count), subtotal: Number(rows[0].subtotal) };
};
