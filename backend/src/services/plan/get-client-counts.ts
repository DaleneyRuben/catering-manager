import { QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize';
import { appToday } from '../../utils/date';

type CountRow = { planId: number; count: string };

export const getClientCounts = async (): Promise<{ planId: number; count: number }[]> => {
  const today = appToday();
  const rows = await sequelize.query<CountRow>(
    `SELECT s."planId", COUNT(c.id) AS count
     FROM subscriptions s
     JOIN clients c ON c.id = s."clientId"
     WHERE c."pausedSince" IS NULL
       AND s."startDate" <= :today
       AND s."contractEndDate" >= :today
       AND s."finalizedAt" IS NULL
     GROUP BY s."planId"`,
    { replacements: { today }, type: QueryTypes.SELECT },
  );
  return rows.map((r) => ({ planId: r.planId, count: Number(r.count) }));
};
