import { Transaction } from 'sequelize';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { withTransaction } from '../../database/with-transaction';
import type { Actor } from '../../types/actor';
import { record } from '../client-history';
import { finalizeOverlappingSubscriptions } from './finalize-overlapping';
import { applyRenewalPauseState, historyEventTypeFor } from './_helpers';

export const markPaid = async (clientId: number, actor: Actor, transaction?: Transaction) => {
  const subscription = await Subscription.findOne({
    where: { clientId, paid: false },
    order: [['id', 'ASC']],
  });
  if (!subscription) return null;

  await withTransaction(transaction, async (t) => {
    await subscription.update({ paid: true }, { transaction: t });

    // These were deferred at creation time while the subscription was unpaid (see
    // subscription/create.ts) — apply them now that payment is confirmed.
    if (subscription.startDate) {
      await finalizeOverlappingSubscriptions(clientId, subscription.startDate, subscription.id, t);
    }
    if (subscription.renewalType) {
      // Read inside the transaction: applyRenewalPauseState branches on client.pausedSince, so a
      // pause written earlier in the same workflow has to be visible or the guard restamps it.
      const client = await Client.findByPk(clientId, { transaction: t });
      await applyRenewalPauseState(client, subscription.renewalType, subscription.startDate, t);
    }

    const eventType = historyEventTypeFor(subscription.renewalType);

    const plan = await Plan.findByPk(subscription.planId, { transaction: t });
    await record(
      actor,
      {
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
      },
      t,
    );
  });

  return subscription;
};
