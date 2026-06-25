import { Op } from 'sequelize';
import Client from '../models/Client';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';

// Shared by report.service and delivery.service: subscriptions whose date range
// covers `date`, for a non-paused client, excluding finalized and suspended-on-date ones.
export const findActiveSubscriptionsForDate = async (date: string): Promise<Subscription[]> => {
  const subscriptions = await Subscription.findAll({
    where: {
      startDate: { [Op.lte]: date },
      contractEndDate: { [Op.gte]: date },
      finalizedAt: { [Op.is]: null },
    },
    include: [{ model: Client, where: { pausedSince: null } }, { model: Plan }],
  });

  return subscriptions.filter((s) => !s.suspendedDates.includes(date));
};
