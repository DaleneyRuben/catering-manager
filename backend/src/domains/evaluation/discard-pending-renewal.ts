import { Transaction } from 'sequelize';
import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import { withTransaction } from '../../database/with-transaction';
import { remove } from '../subscription';

export const discardPendingRenewal = async (clientId: number, transaction?: Transaction) =>
  withTransaction(transaction, async (t) => {
    // Read inside the transaction: this picks the row both deletes below act on, so it has to see
    // an unpaid subscription the same workflow just wrote.
    const subscription = await Subscription.findOne({
      where: { clientId, paid: false },
      order: [['id', 'ASC']],
      transaction: t,
    });
    if (!subscription) return null;

    await Appointment.destroy({ where: { subscriptionId: subscription.id }, transaction: t });
    await remove(subscription.id, t);

    return subscription;
  });
