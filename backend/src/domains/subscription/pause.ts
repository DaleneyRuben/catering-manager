import { Transaction } from 'sequelize';
import Subscription from '../../models/Subscription';
import { HISTORY_EVENTS } from '../../constants/history.constants';
import { withTransaction } from '../../database/with-transaction';
import type { Actor } from '../../types/actor';
import { record } from '../client-history';

// Pausing a plan. Callers name the plan and the intent; which column carries the pause, and the
// history event that goes with it, are this domain's business.
export const pause = async (subscriptionId: number, actor: Actor, transaction?: Transaction) =>
  withTransaction(transaction, async (t) => {
    const subscription = await Subscription.findByPk(subscriptionId, { transaction: t });
    if (!subscription) return null;

    // Re-pausing would restamp the date that resume counts the days still owed from, silently
    // shortening the plan.
    if (subscription.pausedSince) return subscription;

    await subscription.update({ pausedSince: new Date() }, { transaction: t });
    await record(actor, { type: HISTORY_EVENTS.PLAN_PAUSED, clientId: subscription.clientId }, t);

    return subscription;
  });
