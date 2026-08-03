import { Transaction } from 'sequelize';
import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import { withTransaction } from '../../database/with-transaction';
import type { Actor } from '../../types/actor';
import { softDelete } from '../client';
import { remove } from '../subscription';

export const deletePendingClient = async (
  clientId: number,
  actor: Actor,
  transaction?: Transaction,
) =>
  withTransaction(transaction, async (t) => {
    // Read inside the transaction: the ids gathered here are exactly the rows destroyed below, so
    // a subscription the same workflow just wrote has to be visible or it outlives its client.
    const subscriptions = await Subscription.findAll({ where: { clientId }, transaction: t });
    const subscriptionIds = subscriptions.map((s) => s.id);
    if (subscriptionIds.length) {
      await Appointment.destroy({ where: { subscriptionId: subscriptionIds }, transaction: t });
      await remove(subscriptionIds, t);
    }

    return softDelete(clientId, actor, t);
  });
