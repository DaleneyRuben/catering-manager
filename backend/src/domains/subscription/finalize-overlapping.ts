import { Op, Transaction } from 'sequelize';
import Subscription from '../../models/Subscription';
import { appToday, subtractDeliveryDays } from '../../utils/date';

// A renewal/reactivation may start before the previous contract ends; the old
// subscription must stop being "active" or the client is double-counted in
// delivery routes and kitchen report portions for the overlap days.
export const finalizeOverlappingSubscriptions = async (
  clientId: number,
  newStartDate: string,
  excludeId?: number,
  transaction?: Transaction,
) => {
  const overlapping =
    (await Subscription.findAll({
      where: {
        clientId,
        finalizedAt: null,
        contractEndDate: { [Op.gte]: newStartDate },
        ...(excludeId !== undefined ? { id: { [Op.ne]: excludeId } } : {}),
      },
      ...(transaction ? { transaction } : {}),
    })) ?? [];

  const today = appToday();
  await Promise.all(
    overlapping.map((sub) =>
      sub.update(
        {
          contractEndDate: subtractDeliveryDays(newStartDate, 1),
          finalizedAt: today,
        },
        ...(transaction ? [{ transaction }] : []),
      ),
    ),
  );
};
