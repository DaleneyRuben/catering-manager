import { QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize';
import { appToday, addCalendarDays, nextDeliveryDay } from '../../utils/date';

export type DashboardCounts = {
  active: { today: number; tomorrow: number };
  suspended: { today: number; tomorrow: number };
  deliveriesToday: number;
};

type CountsRow = {
  active_today: string;
  active_tomorrow: string;
  suspended_today: string;
  suspended_tomorrow: string;
  deliveries_today: string;
};

export const findCounts = async (): Promise<DashboardCounts> => {
  const today = nextDeliveryDay(appToday());
  const tomorrow = addCalendarDays(today, 1);

  const [row] = await sequelize.query<CountsRow>(
    `SELECT
      COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND NOT (:today::date = ANY(s."suspendedDates")) THEN 1 END) AS active_today,
      COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :tomorrow) AND s."contractEndDate" >= :tomorrow AND s."finalizedAt" IS NULL AND NOT (:tomorrow::date = ANY(s."suspendedDates")) THEN 1 END) AS active_tomorrow,
      COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND :today::date = ANY(s."suspendedDates") THEN 1 END) AS suspended_today,
      COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :tomorrow) AND s."contractEndDate" >= :tomorrow AND s."finalizedAt" IS NULL AND :tomorrow::date = ANY(s."suspendedDates") THEN 1 END) AS suspended_tomorrow,
      COUNT(DISTINCT CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND NOT (:today::date = ANY(s."suspendedDates")) AND c."groupToken" IS NOT NULL THEN c."groupToken" END)
        + COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND NOT (:today::date = ANY(s."suspendedDates")) AND c."groupToken" IS NULL THEN 1 END) AS deliveries_today
    FROM clients c
    LEFT JOIN subscriptions s ON s."id" = (SELECT MAX(s2."id") FROM subscriptions s2 WHERE s2."clientId" = c.id)
    WHERE c."deletedAt" IS NULL`,
    { replacements: { today, tomorrow }, type: QueryTypes.SELECT },
  );

  const r = row as unknown as CountsRow;
  return {
    active: { today: Number(r.active_today), tomorrow: Number(r.active_tomorrow) },
    suspended: { today: Number(r.suspended_today), tomorrow: Number(r.suspended_tomorrow) },
    deliveriesToday: Number(r.deliveries_today),
  };
};
