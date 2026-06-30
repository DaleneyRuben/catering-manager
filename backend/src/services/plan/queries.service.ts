import { QueryTypes } from 'sequelize';
import sequelize from '../../database/sequelize';
import Plan from '../../models/Plan';
import { appToday } from '../../utils/date';

const findAll = () => Plan.findAll({ order: [['price', 'ASC']] });

const findById = (id: number) => Plan.findByPk(id);

const getClientCounts = async (): Promise<Record<number, number>> => {
  type Row = { planId: number; count: string };
  const today = appToday();
  const rows = await sequelize.query<Row>(
    `SELECT s."planId", COUNT(c.id) AS count
     FROM subscriptions s
     JOIN clients c ON c.id = s."clientId"
     WHERE c."pausedSince" IS NULL AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL
     GROUP BY s."planId"`,
    { replacements: { today }, type: QueryTypes.SELECT },
  );
  return rows.reduce<Record<number, number>>((acc, r) => {
    acc[r.planId] = Number(r.count);
    return acc;
  }, {});
};

export default { findAll, findById, getClientCounts };
