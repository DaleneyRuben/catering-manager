import { differenceInBusinessDays, parseISO } from 'date-fns';
import { Transaction } from 'sequelize';
import Subscription from '../../models/Subscription';
import { addDeliveryDaysSkipping, appToday, toAppDate } from '../../utils/date';

// Resuming a paused plan. The client is owed the delivery days they had not used when they
// paused, and the first of them falls on the delivery day after the resume date —
// addDeliveryDaysSkipping counts from the day after `appToday()`, which is why no explicit +1
// appears here.
//
// Suspended days are days the client paid for and did not receive, so they count on neither
// side of the calculation: they are not consumed before the pause, and they do not satisfy the
// days still owed after the resume. Leaving them out of either half silently shortens the plan.
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

  const { startDate, duration } = subscription;
  const suspendedDates = subscription.suspendedDates ?? [];
  const pausedDate = toAppDate(pausedSince);

  const suspendedBeforePause = suspendedDates.filter(
    (date) => date >= startDate && date < pausedDate,
  ).length;
  const elapsed =
    differenceInBusinessDays(
      parseISO(`${pausedDate}T12:00:00`),
      parseISO(`${startDate}T12:00:00`),
    ) - suspendedBeforePause;

  const remaining = duration - elapsed;
  if (remaining <= 0) return subscription;

  await subscription.update(
    { contractEndDate: addDeliveryDaysSkipping(appToday(), remaining, suspendedDates) },
    ...(transaction ? [{ transaction }] : []),
  );

  return subscription;
};
