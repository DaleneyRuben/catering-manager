import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import type { Actor } from '../../types/actor';
import { appToday } from '../../utils/date';
import { finalizeOverlappingSubscriptions } from '../subscription';

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
  if (subscription.renewalType === 'reactivation') {
    const client = await Client.findByPk(clientId);
    if (client) await client.update({ pausedSince: null });
  } else if (subscription.renewalType === 'renewal' && !subscription.startDate) {
    const client = await Client.findByPk(clientId);
    if (client) await client.update({ pausedSince: appToday() });
  }

  const eventTypeByRenewal = {
    reactivation: 'reactivated',
    renewal: 'plan_renewed',
  } as const;
  const eventType = subscription.renewalType
    ? eventTypeByRenewal[subscription.renewalType as 'renewal' | 'reactivation']
    : 'plan_assigned';

  const plan = await Plan.findByPk(subscription.planId);
  await ClientHistory.create({
    clientId,
    eventType,
    occurredAt: new Date(),
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
    userId: actor.userId,
    username: actor.username,
  });

  return subscription;
};
