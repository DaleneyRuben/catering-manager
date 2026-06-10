import { Op, fn, literal, where, QueryTypes } from 'sequelize';
import { appToday, addDeliveryDays } from '../utils/date';
import { EXPIRY_THRESHOLD_DAYS } from '../constants/subscription.constants';
import { CLIENT_STATUS } from '../constants/client.constants';
import Client from '../models/Client';
import ClientHistory from '../models/ClientHistory';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import sequelize from '../database/sequelize';
import { CreateClientDto, UpdateClientDto } from '../schemas/client.schema';

// Ordered newest-first so subscriptions[0] is always the current subscription
const INCLUDE_SUBSCRIPTION_ORDERED = [
  { model: Subscription, include: [Plan], separate: true, order: [['id', 'DESC']] as never },
];

export interface FindAllFilters {
  status?: string;
  q?: string;
  birthMonth?: number;
  page?: number;
  limit?: number;
}

const create = (data: CreateClientDto) => Client.create(data as never);

const findAll = (filters: FindAllFilters = {}) => {
  const todayStr = appToday();
  const thresholdStr = addDeliveryDays(todayStr, EXPIRY_THRESHOLD_DAYS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientWhere: Record<string | symbol, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionWhere: Record<string | symbol, any> = {};
  let subscriptionRequired = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const andConditions: any[] = [];

  switch (filters.status) {
    case CLIENT_STATUS.ACTIVE:
      clientWhere.isActive = true;
      subscriptionWhere.contractEndDate = { [Op.gt]: todayStr };
      andConditions.push(
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" > '${todayStr}')`,
        ),
        // Exclude clients whose subscription hasn't started yet
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE s2."startDate" > '${todayStr}' AND s2."contractEndDate" > '${todayStr}')`,
        ),
      );
      break;
    case CLIENT_STATUS.EXPIRING:
      clientWhere.isActive = true;
      subscriptionWhere.contractEndDate = { [Op.between]: [todayStr, thresholdStr] };
      andConditions.push(
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE s2."startDate" > '${todayStr}' AND s2."contractEndDate" > '${todayStr}')`,
        ),
      );
      break;
    case CLIENT_STATUS.PAUSED:
      subscriptionWhere.contractEndDate = { [Op.gt]: todayStr };
      andConditions.push({
        [Op.or]: [
          { isActive: false },
          literal(
            `"Client"."id" IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" > '${todayStr}')`,
          ),
          // Include clients whose subscription hasn't started yet (future start date)
          literal(
            `"Client"."id" IN (SELECT s2."clientId" FROM subscriptions s2 WHERE s2."startDate" > '${todayStr}' AND s2."contractEndDate" > '${todayStr}')`,
          ),
        ],
      });
      break;
    case CLIENT_STATUS.ENDED:
      subscriptionRequired = false;
      andConditions.push(
        literal(
          `NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s."clientId" = "Client"."id" AND s."contractEndDate" > '${todayStr}')`,
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
      where(fn('EXTRACT', literal('MONTH FROM "Client"."dateOfBirth"')), Op.eq, filters.birthMonth),
    );
  }

  if (andConditions.length) clientWhere[Op.and] = andConditions;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 25;
  const offset = (page - 1) * limit;

  return Client.findAndCountAll({
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
    limit,
    offset,
    distinct: true,
  }).then(({ rows, count }) => ({ rows, total: count }));
};

const getCounts = async () => {
  const todayStr = appToday();
  const thresholdStr = addDeliveryDays(todayStr, EXPIRY_THRESHOLD_DAYS);

  type Row = { active: string; expiring: string; paused: string; ended: string; total: string };
  const [rows] = await sequelize.query<Row>(
    `SELECT
      COUNT(CASE WHEN c."isActive" = true  AND s."contractEndDate" > :today AND (s."startDate" IS NULL OR s."startDate" <= :today) AND NOT (:today::date = ANY(s."suspendedDates")) THEN 1 END) AS active,
      COUNT(CASE WHEN c."isActive" = true  AND s."contractEndDate" > :today AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" <= :threshold             THEN 1 END) AS expiring,
      COUNT(CASE WHEN (c."isActive" = false OR :today::date = ANY(s."suspendedDates") OR (s."startDate" > :today AND s."contractEndDate" > :today)) AND s."contractEndDate" > :today  THEN 1 END) AS paused,
      COUNT(CASE WHEN s."contractEndDate" <= :today OR s."contractEndDate" IS NULL                                                                                                   THEN 1 END) AS ended,
      COUNT(*)                                                                                                                                                                                  AS total
    FROM clients c
    LEFT JOIN subscriptions s ON s."id" = (SELECT MAX(s2."id") FROM subscriptions s2 WHERE s2."clientId" = c.id)`,
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

const findById = (id: number) => Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });

const update = async (id: number, data: UpdateClientDto) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
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
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  const today = appToday();
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

const softDelete = async (id: number) => {
  const client = await Client.findByPk(id);
  if (!client) return null;

  await client.destroy();
  await ClientHistory.create({
    clientId: id,
    eventType: 'deleted',
    occurredAt: new Date(),
    metadata: {},
  });

  return client;
};

export default { create, findAll, findById, update, getCounts, finalize, softDelete };
