import { Op } from 'sequelize';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';

// Shared by findActiveSubscriptionsForDate and findSuspendedSubscriptionsForDate: subscriptions
// whose date range covers `date`, for a non-paused client, excluding finalized ones. Suspension
// on `date` is not filtered here — callers split the result by suspendedDates themselves.
export const findContractActiveSubscriptions = async (date: string): Promise<Subscription[]> =>
  Subscription.findAll({
    where: {
      startDate: { [Op.lte]: date },
      contractEndDate: { [Op.gte]: date },
      finalizedAt: { [Op.is]: null },
      paid: true,
    },
    include: [{ model: Client, where: { pausedSince: null } }, { model: Plan }],
    order: [['createdAt', 'ASC']],
  });

// A client may hold at most one upcoming subscription: one not yet started (a renewal registered
// ahead of time) or one still waiting for a start date (a "sin fecha" renewal).
export const findUpcomingSubscription = async (
  clientId: number,
  today: string,
): Promise<Subscription | null> =>
  Subscription.findOne({
    where: {
      clientId,
      finalizedAt: null,
      [Op.or]: [{ startDate: null }, { startDate: { [Op.gt]: today } }],
    },
  });
