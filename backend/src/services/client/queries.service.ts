import { Op, literal } from 'sequelize';
import { appToday, addDeliveryDays } from '../../utils/date';
import { EXPIRY_THRESHOLD_DAYS } from '../../constants/subscription.constants';
import { CLIENT_STATUS } from '../../constants/client.constants';
import { deriveClientStatus } from '../../utils/clientStatus';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import deliveryGroupService from '../delivery/group.service';

// Ordered newest-first so subscriptions[0] is always the current subscription
export const INCLUDE_SUBSCRIPTION_ORDERED = [
  { model: Subscription, include: [Plan], separate: true, order: [['id', 'DESC']] as never },
];

export interface FindAllFilters {
  status?: string;
  q?: string;
  restriction?: string;
  page?: number;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withStatus(client: any): Record<string, unknown> {
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

const findById = async (id: number) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;
  const base = withStatus(client);
  const groupMembers = client.groupToken
    ? (await deliveryGroupService.findMembers(client.groupToken)).filter((m) => m.id !== id)
    : [];
  return { ...base, groupMembers };
};

export default { findAll, findById };
