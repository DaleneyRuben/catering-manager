import { Transaction } from 'sequelize';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { withTransaction } from '../../database/with-transaction';
import type { Actor } from '../../types/actor';
import { record } from '../client-history';
import { recordPayment } from '../finance';
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
      await applyRenewalPauseState(
        subscription,
        subscription.renewalType,
        subscription.startDate,
        t,
      );
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
          price: subscription.price,
          ...(subscription.appointmentId ? { appointmentId: subscription.appointmentId } : {}),
        },
      },
      t,
    );

    // Deferred with the history write above: this is the moment the money actually arrived, so
    // it is the payment's date under cash basis (ADR-008).
    await recordPayment(
      { clientId, subscriptionId: subscription.id, amount: subscription.price },
      actor,
      t,
    );
  });

  return subscription;
};
