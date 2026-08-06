import { QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize';

type EarliestRow = { earliest: string | null };

// The lower bound of the month selector, owned by the server the way Producción owns weekStarts.
// There is no data before the register went live and no backfill, so paging further back would
// show empty months that read as months with no money rather than months that never existed.
export const findEarliestMonth = async (): Promise<string | null> => {
  const rows = await sequelize.query<EarliestRow>(
    `SELECT MIN(date) AS earliest
     FROM (
       SELECT MIN("paidAt") AS date FROM payments
       UNION ALL
       SELECT MIN("spentAt") AS date FROM expenses WHERE "deletedAt" IS NULL
     ) AS movements`,
    { type: QueryTypes.SELECT },
  );

  const { earliest } = rows[0];
  return earliest ? earliest.slice(0, 7) : null;
};
