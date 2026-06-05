import { Op } from 'sequelize';
import Client from '../models/Client';
import Subscription from '../models/Subscription';

const findDeliveryClientsForDate = async (date: string): Promise<string[]> => {
  const subscriptions = await Subscription.findAll({
    where: {
      startDate: { [Op.lte]: date },
      contractEndDate: { [Op.gte]: date },
    },
    include: [{ model: Client, where: { isActive: true } }],
  });

  return subscriptions
    .filter((s) => !s.suspendedDates.includes(date))
    .map((s) => (s.client as Client).name)
    .sort((a, b) => a.localeCompare(b, 'es'));
};

export default { findDeliveryClientsForDate };
