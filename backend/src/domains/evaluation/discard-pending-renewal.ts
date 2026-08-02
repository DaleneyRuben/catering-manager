import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import { remove } from '../subscription';

export const discardPendingRenewal = async (clientId: number) => {
  const subscription = await Subscription.findOne({
    where: { clientId, paid: false },
    order: [['id', 'ASC']],
  });
  if (!subscription) return null;

  await Appointment.destroy({ where: { subscriptionId: subscription.id } });
  await remove(subscription.id);

  return subscription;
};
