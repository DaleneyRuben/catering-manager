import { Op, literal } from 'sequelize';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday, addDeliveryDays } from '../../utils/date';
import { EXPIRY_THRESHOLD_DAYS } from '../../constants/subscription.constants';
import { CLIENT_STATUS } from '../../constants/client.constants';
import { withStatus } from './_helpers';

// Escapes LIKE metacharacters so a query like "%" or "_" is matched literally
// instead of acting as a wildcard.
const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&');

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

  // A client whose plan is still running is described by that plan, even once a renewal has
  // been registered for a later start date — mirrors withStatus's subscription selection.
  const hasRunningSubscription = `EXISTS (SELECT 1 FROM subscriptions sr WHERE sr."clientId" = "Client"."id" AND sr."startDate" <= '${todayStr}' AND sr."contractEndDate" >= '${todayStr}' AND sr."finalizedAt" IS NULL)`;
  const onlyFutureSubscription = (endComparator: '>=' | '>') =>
    `("Client"."id" IN (SELECT s2."clientId" FROM subscriptions s2 WHERE s2."startDate" > '${todayStr}' AND s2."contractEndDate" ${endComparator} '${todayStr}') AND NOT ${hasRunningSubscription})`;

  // Which pause matters is the same question deriveClientStatus answers: the one on the plan that
  // describes the client today. Asking whether ANY plan of theirs is paused would reinstate the
  // client-wide flag the column move removed — a paused sin-fecha renewal would drag a client with
  // a running plan into Pausados while their badge still read Activo.
  const hasRunningUnpausedSubscription = `EXISTS (SELECT 1 FROM subscriptions sr WHERE sr."clientId" = "Client"."id" AND sr."startDate" <= '${todayStr}' AND sr."contractEndDate" >= '${todayStr}' AND sr."finalizedAt" IS NULL AND sr."pausedSince" IS NULL)`;
  const currentSubscriptionPaused = `(EXISTS (SELECT 1 FROM subscriptions sp WHERE sp."clientId" = "Client"."id" AND sp."pausedSince" IS NOT NULL AND sp."finalizedAt" IS NULL) AND NOT ${hasRunningUnpausedSubscription})`;

  switch (filters.status) {
    case CLIENT_STATUS.ACTIVE:
      subscriptionWhere.pausedSince = { [Op.is]: null };
      subscriptionWhere.contractEndDate = { [Op.gte]: todayStr };
      subscriptionWhere.finalizedAt = { [Op.is]: null };
      andConditions.push(
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" >= '${todayStr}')`,
        ),
        literal(`NOT ${onlyFutureSubscription('>=')}`),
        literal(`NOT ${currentSubscriptionPaused}`),
      );
      break;
    case CLIENT_STATUS.EXPIRING:
      subscriptionWhere.pausedSince = { [Op.is]: null };
      subscriptionWhere.finalizedAt = { [Op.is]: null };
      andConditions.push(
        // filtered on the client, not on the join: a queued renewal ends beyond the expiry
        // window and constraining the join would drop it from the payload
        literal(
          `EXISTS (SELECT 1 FROM subscriptions se WHERE se."clientId" = "Client"."id" AND se."contractEndDate" BETWEEN '${todayStr}' AND '${thresholdStr}' AND se."finalizedAt" IS NULL)`,
        ),
        literal(
          `"Client"."id" NOT IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" >= '${todayStr}')`,
        ),
        literal(`NOT ${onlyFutureSubscription('>')}`),
        literal(`NOT ${currentSubscriptionPaused}`),
      );
      break;
    case CLIENT_STATUS.PAUSED:
      subscriptionWhere.contractEndDate = { [Op.gte]: todayStr };
      subscriptionWhere.finalizedAt = { [Op.is]: null };
      andConditions.push({
        [Op.or]: [
          literal(currentSubscriptionPaused),
          literal(
            `"Client"."id" IN (SELECT s2."clientId" FROM subscriptions s2 WHERE '${todayStr}'::date = ANY(s2."suspendedDates") AND s2."contractEndDate" >= '${todayStr}')`,
          ),
          literal(onlyFutureSubscription('>=')),
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

  // A client whose ONLY subscription is unpaid (an Evaluaciones conversion awaiting payment)
  // must never surface here — only Evaluaciones' own "Pendientes de pago" query can see them.
  // A client with a real paid subscription plus a newer unpaid renewal must stay visible
  // (see find-by-id.ts's matching sole-subscription rule).
  andConditions.push(
    literal(
      `NOT EXISTS (SELECT 1 FROM subscriptions ps WHERE ps."clientId" = "Client"."id" AND ps."paid" = false AND (SELECT COUNT(*) FROM subscriptions ps2 WHERE ps2."clientId" = "Client"."id") = 1)`,
    ),
  );

  if (filters.q) {
    const q = `%${escapeLikePattern(filters.q)}%`;
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
    replacements.restrictionTerm = `%${escapeLikePattern(filters.restriction)}%`;
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
