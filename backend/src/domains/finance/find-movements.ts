import { QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize';
import { monthBounds } from './_helpers';

type MovementRow = {
  kind: 'income' | 'expense';
  id: number;
  date: string;
  amount: string;
  label: string;
  description: string | null;
};

export type Movement = Omit<MovementRow, 'amount'> & { amount: number };

// One chronological stream in both directions — a cash register is money moving in and out, and
// splitting it into two tabs makes the reader do the balance arithmetic themselves.
//
// The clients join deliberately does not filter "deletedAt": Client is soft-deleted, so filtering
// it would drop a deleted client's payments and quietly lower a closed month's income.
export const findMovements = async (month: string): Promise<Movement[]> => {
  const rows = await sequelize.query<MovementRow>(
    `SELECT 'income' AS kind, p.id, p."paidAt" AS date, p.amount, c.name AS label,
            NULL AS description
     FROM payments p
     JOIN clients c ON c.id = p."clientId"
     WHERE p."paidAt" BETWEEN :start AND :end
     UNION ALL
     SELECT 'expense' AS kind, e.id, e."spentAt" AS date, e.amount, cat.name AS label,
            e.description
     FROM expenses e
     JOIN expense_categories cat ON cat.id = e."categoryId"
     WHERE e."deletedAt" IS NULL
       AND e."spentAt" BETWEEN :start AND :end
     ORDER BY date DESC, id DESC`,
    { replacements: monthBounds(month), type: QueryTypes.SELECT },
  );

  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
};
