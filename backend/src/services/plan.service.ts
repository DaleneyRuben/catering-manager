import { QueryTypes } from 'sequelize';
import sequelize from '../database/sequelize';
import Plan from '../models/Plan';
import { appToday } from '../utils/date';
import { CreatePlanDto, UpdatePlanDto } from '../schemas/plan.schema';

const create = (data: CreatePlanDto) => Plan.create(data as never);

const findAll = () => Plan.findAll();

const findById = (id: number) => Plan.findByPk(id);

const update = async (id: number, data: UpdatePlanDto) => {
  const plan = await Plan.findByPk(id);
  if (!plan) return null;
  return plan.update(data);
};

const remove = async (id: number): Promise<boolean> => {
  const plan = await Plan.findByPk(id);
  if (!plan) return false;
  await plan.destroy();
  return true;
};

const getClientCounts = async (): Promise<Record<number, number>> => {
  type Row = { planId: number; count: string };
  const today = appToday();
  const rows = await sequelize.query<Row>(
    `SELECT s."planId", COUNT(c.id) AS count
     FROM subscriptions s
     JOIN clients c ON c.id = s."clientId"
     WHERE c."pausedSince" IS NULL AND s."contractEndDate" >= :today
     GROUP BY s."planId"`,
    { replacements: { today }, type: QueryTypes.SELECT },
  );
  return rows.reduce<Record<number, number>>((acc, r) => {
    acc[r.planId] = Number(r.count);
    return acc;
  }, {});
};

export default { create, findAll, findById, update, remove, getClientCounts };
