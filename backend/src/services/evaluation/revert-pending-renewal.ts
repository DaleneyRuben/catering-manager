import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';

export const revertPendingRenewal = async (clientId: number) => {
  const subscription = await Subscription.findOne({
    where: { clientId, paid: false },
    order: [['id', 'ASC']],
  });
  if (!subscription) return null;

  const appointment = await Appointment.findOne({ where: { subscriptionId: subscription.id } });
  if (appointment) {
    const today = appToday();
    // A reverted appointment must reappear in the nutritionist's queue — if its original
    // date has already passed, the stale-pendiente prune (date < today, no subscriptionId)
    // would otherwise hard-delete it on the next queue read instead.
    const isPastDate = appointment.date && appointment.date < today;
    await appointment.update({
      subscriptionId: null,
      ...(isPastDate ? { date: today } : {}),
    });
  }

  await subscription.destroy({ force: true });

  return subscription;
};
