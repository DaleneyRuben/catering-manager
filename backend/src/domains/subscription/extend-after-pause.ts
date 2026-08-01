import { differenceInBusinessDays, parseISO } from 'date-fns';
import { Transaction } from 'sequelize';
import Subscription from '../../models/Subscription';
import { addDeliveryDays, appToday, toAppDate } from '../../utils/date';

// Resuming a paused plan. The client is owed the delivery days they had not used when they
// paused, and the first of them falls on the delivery day after the resume date — addDeliveryDays
// counts from the day after `appToday()`, which is why no explicit +1 appears here.
export const extendAfterPause = async (
  subscriptionId: number,
  pausedSince: Date,
  transaction?: Transaction,
) => {
  const subscription = await Subscription.findByPk(
    subscriptionId,
    ...(transaction ? [{ transaction }] : []),
  );
  if (!subscription?.startDate) return null;

  const elapsed = differenceInBusinessDays(
    parseISO(`${toAppDate(pausedSince)}T12:00:00`),
    parseISO(`${subscription.startDate}T12:00:00`),
  );
  const remaining = subscription.duration - elapsed;
  if (remaining <= 0) return subscription;

  await subscription.update(
    { contractEndDate: addDeliveryDays(appToday(), remaining) },
    ...(transaction ? [{ transaction }] : []),
  );

  return subscription;
};
