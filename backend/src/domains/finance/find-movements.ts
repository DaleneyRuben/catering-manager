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
  clientId: number | null;
  clientArchived: boolean;
  categoryId: number | null;
  registeredByName: string | null;
  registeredAt: string;
};

export type Movement = Omit<MovementRow, 'amount'> & { amount: number };

// One chronological stream in both directions — a cash register is money moving in and out, and
// splitting it into two tabs makes the reader do the balance arithmetic themselves.
//
// Each half projects the other's columns as typed NULLs so the UNION lines up: only income has a
// client, only an expense has a category.
//
// The clients join deliberately does not filter "deletedAt": Client is soft-deleted, so filtering
// it would drop a deleted client's payments and quietly lower a closed month's income. It is read
// instead, to flag the row — the payment still counts, but the name no longer leads anywhere.
//
// registeredBy is ON DELETE SET NULL on both tables, so the join to users is a LEFT JOIN: a
// hard-deleted admin leaves their rows behind, unattributed.
export const findMovements = async (month: string): Promise<Movement[]> => {
  const rows = await sequelize.query<MovementRow>(
    `SELECT 'income' AS kind, p.id, p."paidAt" AS date, p.amount, c.name AS label,
            NULL AS description,
            p."clientId", c."deletedAt" IS NOT NULL AS "clientArchived",
            NULL::integer AS "categoryId",
            u.username AS "registeredByName", p."createdAt" AS "registeredAt"
     FROM payments p
     JOIN clients c ON c.id = p."clientId"
     LEFT JOIN users u ON u.id = p."registeredBy"
     WHERE p."paidAt" BETWEEN :start AND :end
     UNION ALL
     SELECT 'expense' AS kind, e.id, e."spentAt" AS date, e.amount, cat.name AS label,
            e.description,
            NULL::integer AS "clientId", false AS "clientArchived",
            e."categoryId",
            u.username AS "registeredByName", e."createdAt" AS "registeredAt"
     FROM expenses e
     JOIN expense_categories cat ON cat.id = e."categoryId"
     LEFT JOIN users u ON u.id = e."registeredBy"
     WHERE e."deletedAt" IS NULL
       AND e."spentAt" BETWEEN :start AND :end
     ORDER BY date DESC, id DESC`,
    { replacements: monthBounds(month), type: QueryTypes.SELECT },
  );

  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
};
