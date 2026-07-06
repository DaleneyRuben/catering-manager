import { Op, literal } from 'sequelize';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday, addDeliveryDays } from '../../utils/date';
import { EXPIRY_THRESHOLD_DAYS } from '../../constants/subscription.constants';
import { CLIENT_STATUS } from '../../constants/client.constants';
import { withStatus } from './_helpers';

export interface FindAllFilters {
  status?: string;
  q?: string;
  restriction?: string;
  page?: number;
  limit?: number;
}

export const findAll = (filters: FindAllFilters = {}) => {
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
      subscriptionWhere.contractEndDate = { [Op.gte]: todayStr };
      subscriptionWhere.finalizedAt = { [Op.is]: null };
      andConditions.push(
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" >= '${todayStr}')`,
        ),
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
    order: [['createdAt', 'ASC']],
    limit,
    offset,
    distinct: true,
    ...(Object.keys(replacements).length ? { replacements } : {}),
  }).then(({ rows, count }) => {
    const processed = rows.map(withStatus);
    return { rows: processed, total: count };
  });
};
