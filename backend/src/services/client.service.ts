import { Op, literal, QueryTypes } from 'sequelize';
import { addBusinessDays } from 'date-fns';
import Client from '../models/Client';
import ClientHistory from '../models/ClientHistory';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import sequelize from '../database/sequelize';
import { CreateClientDto, UpdateClientDto } from '../schemas/client.schema';

const INCLUDE_SUBSCRIPTION = [{ model: Subscription, include: [Plan] }];

export interface FindAllFilters {
  status?: string;
  q?: string;
  birthMonth?: number;
}

const create = (data: CreateClientDto) => Client.create(data as never);

const findAll = (filters: FindAllFilters = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryThreshold = addBusinessDays(today, 5);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientWhere: Record<string | symbol, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionWhere: Record<string | symbol, any> = {};
  let subscriptionRequired = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const andConditions: any[] = [];

  switch (filters.status) {
    case 'active':
      clientWhere.isActive = true;
      subscriptionWhere.contractEndDate = { [Op.gt]: today };
      break;
    case 'expiring':
      clientWhere.isActive = true;
      subscriptionWhere.contractEndDate = { [Op.between]: [today, expiryThreshold] };
      break;
    case 'paused':
      clientWhere.isActive = false;
      subscriptionWhere.contractEndDate = { [Op.gt]: today };
      break;
    case 'ended':
      subscriptionRequired = false;
      andConditions.push(
        literal(
          `("subscriptions"."contractEndDate" IS NULL OR "subscriptions"."contractEndDate"::date <= CURRENT_DATE)`,
        ),
      );
      break;
    default:
      break;
  }

  if (filters.q) {
    const q = `%${filters.q}%`;
    andConditions.push({
      [Op.or]: [
        { name: { [Op.iLike]: q } },
        { address: { [Op.iLike]: q } },
        { nit: { [Op.iLike]: q } },
      ],
    });
  }

  if (filters.birthMonth) {
    andConditions.push(
      literal(`EXTRACT(MONTH FROM "Client"."dateOfBirth") = ${filters.birthMonth}`),
    );
  }

  if (andConditions.length) clientWhere[Op.and] = andConditions;

  return Client.findAll({
    where:
      Object.getOwnPropertySymbols(clientWhere).length || Object.keys(clientWhere).length
        ? clientWhere
        : undefined,
    include: [
      {
        model: Subscription,
        include: [Plan],
        ...(Object.keys(subscriptionWhere).length ? { where: subscriptionWhere } : {}),
        required: subscriptionRequired,
      },
    ],
  });
};

const getCounts = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threshold = addBusinessDays(today, 5);
  const todayStr = today.toISOString().slice(0, 10);
  const thresholdStr = threshold.toISOString().slice(0, 10);

  type Row = { active: string; expiring: string; paused: string; ended: string; total: string };
  const [rows] = await sequelize.query<Row>(
    `SELECT
      COUNT(CASE WHEN c."isActive" = true  AND s."contractEndDate" > :today                                  THEN 1 END) AS active,
      COUNT(CASE WHEN c."isActive" = true  AND s."contractEndDate" > :today AND s."contractEndDate" <= :threshold THEN 1 END) AS expiring,
      COUNT(CASE WHEN c."isActive" = false AND s."contractEndDate" > :today                                  THEN 1 END) AS paused,
      COUNT(CASE WHEN s."contractEndDate" <= :today OR s."contractEndDate" IS NULL                            THEN 1 END) AS ended,
      COUNT(*)                                                                                                             AS total
    FROM clients c
    LEFT JOIN subscriptions s ON s."clientId" = c.id`,
    { replacements: { today: todayStr, threshold: thresholdStr }, type: QueryTypes.SELECT },
  );

  const row = rows as unknown as Row;
  return {
    active: Number(row.active),
    expiring: Number(row.expiring),
    paused: Number(row.paused),
    ended: Number(row.ended),
    total: Number(row.total),
  };
};

const findById = (id: number) => Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION });

const update = async (id: number, data: UpdateClientDto) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION });
  if (!client) return null;

  if (data.isActive !== undefined && data.isActive !== client.isActive) {
    await ClientHistory.create({
      clientId: client.id,
      eventType: data.isActive ? 'resumed' : 'paused',
      occurredAt: new Date(),
      metadata: {},
    });
  }

  return client.update(data);
};

const finalize = async (id: number) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION });
  if (!client) return null;

  const today = new Date().toISOString().slice(0, 10);
  const sub = (client as never as { subscriptions: { update: (d: object) => Promise<void> }[] })
    .subscriptions?.[0];

  if (sub) await sub.update({ contractEndDate: today });
  await client.update({ isActive: false });
  await ClientHistory.create({
    clientId: client.id,
    eventType: 'finalized',
    occurredAt: new Date(),
    metadata: {},
  });

  return client;
};

export default { create, findAll, findById, update, getCounts, finalize };
