import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import type { Actor } from '../../types/actor';
import { softDelete } from '../client';

export const deletePendingClient = async (clientId: number, actor: Actor) => {
  const subscriptions = await Subscription.findAll({ where: { clientId } });
  const subscriptionIds = subscriptions.map((s) => s.id);
  if (subscriptionIds.length) {
    await Appointment.destroy({ where: { subscriptionId: subscriptionIds } });
  }

  return softDelete(clientId, actor);
};
