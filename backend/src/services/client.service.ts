import { differenceInBusinessDays, parseISO } from 'date-fns';
import { Op, fn, literal, where, QueryTypes } from 'sequelize';
import { appToday, addDeliveryDays, toAppDate } from '../utils/date';
import { EXPIRY_THRESHOLD_DAYS } from '../constants/subscription.constants';
import { CLIENT_STATUS } from '../constants/client.constants';
import { deriveClientStatus } from '../utils/clientStatus';
import Client from '../models/Client';
import ClientHistory from '../models/ClientHistory';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import sequelize from '../database/sequelize';
import { CreateClientDto, UpdateClientDto } from '../schemas/client.schema';
import deliveryGroupService from './deliveryGroup.service';

// Ordered newest-first so subscriptions[0] is always the current subscription
const INCLUDE_SUBSCRIPTION_ORDERED = [
  { model: Subscription, include: [Plan], separate: true, order: [['id', 'DESC']] as never },
];

export interface FindAllFilters {
  status?: string;
  q?: string;
  restriction?: string;
  birthMonth?: number;
  page?: number;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withStatus(client: any): Record<string, unknown> {
  const today = appToday();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: any[] = client.subscriptions ?? [];
  subs.sort((a, b) => b.id - a.id);
  const sub = subs[0] ?? null;
  const status = deriveClientStatus(
    {
      pausedSince: client.pausedSince ?? null,
      sub: sub
        ? {
            startDate: sub.startDate ?? null,
            contractEndDate: sub.contractEndDate ?? null,
            suspendedDates: sub.suspendedDates ?? [],
            finalizedAt: sub.finalizedAt ?? null,
          }
        : null,
    },
    today,
  );
  const plain: Record<string, unknown> =
    typeof client.toJSON === 'function' ? client.toJSON() : { ...client };
  return { ...plain, status };
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
      clientWhere.pausedSince = { [Op.is]: null };
      // contractEndDate >= today: end date is inclusive per business rules
      subscriptionWhere.contractEndDate = { [Op.gte]: todayStr };
      subscriptionWhere.finalizedAt = { [Op.is]: null };
      andConditions.push(
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" >= '${todayStr}')`,
        ),
        // Exclude clients whose subscription hasn't started yet
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE s2."startDate" > '${todayStr}' AND s2."contractEndDate" >= '${todayStr}')`,
        ),
      );
      break;
    case CLIENT_STATUS.EXPIRING:
      clientWhere.pausedSince = { [Op.is]: null };
      subscriptionWhere.contractEndDate = { [Op.between]: [todayStr, thresholdStr] };
      subscriptionWhere.finalizedAt = { [Op.is]: null };
      andConditions.push(
        // suspended-today clients belong under "paused", not "expiring"
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" >= '${todayStr}')`,
        ),
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE s2."startDate" > '${todayStr}' AND s2."contractEndDate" > '${todayStr}')`,
        ),
      );
      break;
    case CLIENT_STATUS.PAUSED:
      subscriptionWhere.contractEndDate = { [Op.gte]: todayStr };
      subscriptionWhere.finalizedAt = { [Op.is]: null };
      andConditions.push({
        [Op.or]: [
          { pausedSince: { [Op.not]: null } },
          literal(
            `"Client"."id" IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" >= '${todayStr}')`,
          ),
          // Include clients whose subscription hasn't started yet (future start date)
          literal(
            `"Client"."id" IN (SELECT s2."clientId" FROM subscriptions s2 WHERE s2."startDate" > '${todayStr}' AND s2."contractEndDate" >= '${todayStr}')`,
          ),
        ],
      });
      break;
    case CLIENT_STATUS.ENDED:
      subscriptionRequired = false;
      andConditions.push(
        literal(
          // finalizedAt IS NULL ensures finalized clients (contractEndDate = today) are caught here
          `NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s."clientId" = "Client"."id" AND s."contractEndDate" >= '${todayStr}' AND s."finalizedAt" IS NULL)`,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const replacements: Record<string, any> = {};
  if (filters.restriction) {
    replacements.restrictionTerm = `%${filters.restriction}%`;
    andConditions.push(
      literal(
        `EXISTS (SELECT 1 FROM unnest("Client"."restrictions") r WHERE r ILIKE :restrictionTerm)`,
      ),
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
    ...(Object.keys(replacements).length ? { replacements } : {}),
  }).then(({ rows, count }) => {
    const processed = rows.map(withStatus);
    return { rows: processed, total: count };
  });
};

const getCounts = async () => {
  const todayStr = appToday();
  const thresholdStr = addDeliveryDays(todayStr, EXPIRY_THRESHOLD_DAYS);

  type Row = { active: string; expiring: string; paused: string; ended: string; total: string };
  const [rows] = await sequelize.query<Row>(
    `SELECT
      COUNT(CASE WHEN c."pausedSince" IS NULL     AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND NOT (:today::date = ANY(s."suspendedDates")) THEN 1 END) AS active,
      COUNT(CASE WHEN c."pausedSince" IS NULL     AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" <= :threshold             THEN 1 END) AS expiring,
      COUNT(CASE WHEN (c."pausedSince" IS NOT NULL OR :today::date = ANY(s."suspendedDates") OR (s."startDate" > :today AND s."contractEndDate" >= :today)) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL THEN 1 END) AS paused,
      COUNT(CASE WHEN s."contractEndDate" < :today OR s."contractEndDate" IS NULL OR s."finalizedAt" IS NOT NULL                                                                                                          THEN 1 END) AS ended,
      COUNT(*)                                                                                                                                                                                                                       AS total
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

const findById = async (id: number) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;
  const base = withStatus(client);
  const groupMembers = client.groupToken
    ? (await deliveryGroupService.findMembers(client.groupToken)).filter((m) => m.id !== id)
    : [];
  return { ...base, groupMembers };
};

const update = async (id: number, data: UpdateClientDto) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  if (data.pausedSince !== undefined) {
    const isPausing = data.pausedSince !== null && client.pausedSince === null;
    const isResuming = data.pausedSince === null && client.pausedSince !== null;
    if (isPausing || isResuming) {
      await ClientHistory.create({
        clientId: client.id,
        eventType: isPausing ? 'paused' : 'resumed',
        occurredAt: new Date(),
        metadata: {},
      });
    }

    if (isResuming && client.pausedSince) {
      type SubLike = {
        startDate: string | null;
        duration: number;
        update: (d: object) => Promise<void>;
      };
      const subs = (client as never as { subscriptions: SubLike[] }).subscriptions ?? [];
      const sub = subs[0];
      if (sub?.startDate) {
        const pausedDateStr = toAppDate(client.pausedSince);
        const elapsed = differenceInBusinessDays(
          parseISO(`${pausedDateStr}T12:00:00`),
          parseISO(`${sub.startDate}T12:00:00`),
        );
        const remaining = sub.duration - elapsed;
        if (remaining > 0) {
          const newContractEndDate = addDeliveryDays(appToday(), remaining);
          await sub.update({ contractEndDate: newContractEndDate });
        }
      }
    }
  }

  const updated = await client.update(data);
  return withStatus(updated);
};

const finalize = async (id: number) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  const sub = (client as never as { subscriptions: { update: (d: object) => Promise<void> }[] })
    .subscriptions?.[0];

  const today = appToday();
  if (sub) await sub.update({ contractEndDate: today, finalizedAt: today });
  await ClientHistory.create({
    clientId: client.id,
    eventType: 'finalized',
    occurredAt: new Date(),
    metadata: {},
  });

  return withStatus(client);
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
