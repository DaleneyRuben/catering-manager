import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';

export const revertPendingRenewal = async (clientId: number) => {
  const subscription = await Subscription.findOne({ where: { clientId, paid: false } });
  if (!subscription) return null;

  const appointment = await Appointment.findOne({ where: { subscriptionId: subscription.id } });
  if (appointment) {
    await appointment.update({ subscriptionId: null });
  }

  await subscription.destroy();

  return subscription;
};
