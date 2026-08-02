import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import type { Actor } from '../../types/actor';
import { record } from '../client-history';
import { finalizeOverlappingSubscriptions } from './finalize-overlapping';
import { applyRenewalPauseState, historyEventTypeFor } from './_helpers';

export const markPaid = async (clientId: number, actor: Actor) => {
  const subscription = await Subscription.findOne({
    where: { clientId, paid: false },
    order: [['id', 'ASC']],
  });
  if (!subscription) return null;

  await subscription.update({ paid: true });

  // These were deferred at creation time while the subscription was unpaid (see
  // subscription/create.ts) — apply them now that payment is confirmed.
  if (subscription.startDate) {
    await finalizeOverlappingSubscriptions(clientId, subscription.startDate, subscription.id);
  }
  if (subscription.renewalType) {
    const client = await Client.findByPk(clientId);
    await applyRenewalPauseState(client, subscription.renewalType, subscription.startDate);
  }

  const eventType = historyEventTypeFor(subscription.renewalType);

  const plan = await Plan.findByPk(subscription.planId);
  await record(actor, {
    type: eventType,
    clientId,
    metadata: {
      planId: subscription.planId,
      planName: plan?.name ?? null,
      planPrice: plan?.price ?? null,
      startDate: subscription.startDate,
      duration: subscription.duration,
      contractEndDate: subscription.contractEndDate,
      discount: subscription.discount,
      ...(subscription.appointmentId ? { appointmentId: subscription.appointmentId } : {}),
    },
  });

  return subscription;
};
