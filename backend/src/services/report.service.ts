import { Op } from 'sequelize';
import Client from '../models/Client';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';

const findDeliveryClientsForDate = async (date: string): Promise<string[]> => {
  const subscriptions = await Subscription.findAll({
    where: {
      startDate: { [Op.lte]: date },
      contractEndDate: { [Op.gte]: date },
      finalizedAt: { [Op.is]: null },
    },
    include: [{ model: Client, where: { pausedSince: null } }],
  });

  return subscriptions
    .filter((s) => !s.suspendedDates.includes(date))
    .map((s) => (s.client as Client).name)
    .sort((a, b) => a.localeCompare(b, 'es'));
};

export type ActiveClientRow = {
  name: string;
  planMeals: string[];
  restrictions: string[];
};

const findActiveClientsWithPlansForDate = async (date: string): Promise<ActiveClientRow[]> => {
  const subscriptions = await Subscription.findAll({
    where: {
      startDate: { [Op.lte]: date },
      contractEndDate: { [Op.gte]: date },
      finalizedAt: { [Op.is]: null },
    },
    include: [{ model: Client, where: { pausedSince: null } }, { model: Plan }],
  });

  return subscriptions
    .filter((s) => !s.suspendedDates.includes(date))
    .map((s) => ({
      name: (s.client as Client).name,
      planMeals: (s.plan as Plan).meals,
      restrictions: (s.client as Client).restrictions,
    }));
};

export default { findDeliveryClientsForDate, findActiveClientsWithPlansForDate };
