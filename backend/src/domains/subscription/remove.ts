import { Transaction } from 'sequelize';
import Subscription from '../../models/Subscription';

// Subscriptions are never soft-deleted: one is removed only when it should not have existed at
// all (an abandoned unpaid resolution), and client_history keeps the record of what happened.
export const remove = async (id: number | number[], transaction?: Transaction) => {
  const ids = Array.isArray(id) ? id : [id];
  if (!ids.length) return;

  await Subscription.destroy({
    where: { id: ids },
    ...(transaction ? { transaction } : {}),
  });
};
