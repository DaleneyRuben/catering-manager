import { Op } from 'sequelize';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday, subtractDeliveryDays } from '../../utils/date';

// Shared by findActiveSubscriptionsForDate and findSuspendedSubscriptionsForDate: subscriptions
// whose date range covers `date`, for a non-paused client, excluding finalized ones. Suspension
// on `date` is not filtered here — callers split the result by suspendedDates themselves.
export const findContractActiveSubscriptions = async (date: string): Promise<Subscription[]> =>
  Subscription.findAll({
    where: {
      startDate: { [Op.lte]: date },
      contractEndDate: { [Op.gte]: date },
      finalizedAt: { [Op.is]: null },
    },
    include: [{ model: Client, where: { pausedSince: null } }, { model: Plan }],
    order: [['createdAt', 'ASC']],
  });

// A renewal/reactivation may start before the previous contract ends; the old
// subscription must stop being "active" or the client is double-counted in
// delivery routes and kitchen report portions for the overlap days.
export const finalizeOverlappingSubscriptions = async (
  clientId: number,
  newStartDate: string,
  excludeId?: number,
) => {
  const overlapping =
    (await Subscription.findAll({
      where: {
        clientId,
        finalizedAt: null,
        contractEndDate: { [Op.gte]: newStartDate },
        ...(excludeId !== undefined ? { id: { [Op.ne]: excludeId } } : {}),
      },
    })) ?? [];

  const today = appToday();
  await Promise.all(
    overlapping.map((sub) =>
      sub.update({
        contractEndDate: subtractDeliveryDays(newStartDate, 1),
        finalizedAt: today,
      }),
    ),
  );
};
