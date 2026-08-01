import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import type { Actor } from '../../types/actor';
import { softDelete } from '../client';
import { remove } from '../subscription';

export const deletePendingClient = async (clientId: number, actor: Actor) => {
  const subscriptions = await Subscription.findAll({ where: { clientId } });
  const subscriptionIds = subscriptions.map((s) => s.id);
  if (subscriptionIds.length) {
    await Appointment.destroy({ where: { subscriptionId: subscriptionIds } });
    await remove(subscriptionIds);
  }

  return softDelete(clientId, actor);
};
