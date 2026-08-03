import { Transaction } from 'sequelize';
import Subscription from '../../models/Subscription';
import { HISTORY_EVENTS } from '../../constants/history.constants';
import { withTransaction } from '../../database/with-transaction';
import type { Actor } from '../../types/actor';
import { record } from '../client-history';
import { extendAfterPause } from './extend-after-pause';

// Resuming a paused plan: the contract is pushed out by the days the client had not used, and
// only then is the pause cleared, so a failed extension leaves the plan paused rather than
// running with a contract that never got its days back.
export const resume = async (subscriptionId: number, actor: Actor, transaction?: Transaction) =>
  withTransaction(transaction, async (t) => {
    const subscription = await Subscription.findByPk(subscriptionId, { transaction: t });
    if (!subscription) return null;

    const { pausedSince } = subscription;
    if (!pausedSince) return subscription;

    // A "sin fecha" renewal is paused before delivering anything, so it is owed nothing —
    // extending it would hand out days for meals that were never withheld.
    if (subscription.startDate) await extendAfterPause(subscriptionId, pausedSince, t);

    await subscription.update({ pausedSince: null }, { transaction: t });
    await record(actor, { type: HISTORY_EVENTS.PLAN_RESUMED, clientId: subscription.clientId }, t);

    return subscription;
  });
