import { Transaction } from 'sequelize';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';

// Ending a plan early: the contract stops today and the row is stamped so it stops counting as
// live. Callers say "finalize this plan" — which columns express that is this domain's business.
export const finalize = async (subscriptionId: number, transaction?: Transaction) => {
  const subscription = await Subscription.findByPk(
    subscriptionId,
    ...(transaction ? [{ transaction }] : []),
  );
  if (!subscription) return null;

  const today = appToday();
  await subscription.update(
    { contractEndDate: today, finalizedAt: today },
    ...(transaction ? [{ transaction }] : []),
  );

  return subscription;
};
