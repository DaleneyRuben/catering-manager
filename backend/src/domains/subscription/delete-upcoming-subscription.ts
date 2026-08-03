import { Op, Transaction } from 'sequelize';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { withTransaction } from '../../database/with-transaction';
import { appToday } from '../../utils/date';
import { ConflictError } from '../../utils/errors';
import { Actor } from '../../types/actor';
import { record } from '../client-history';

// Only a renewal registered ahead of time can be removed: the running plan is ended with
// Finalizar plan, and a client whose only live plan has not started yet keeps it — deleting it
// would leave them with no plan at all instead of one that ended.
export const deleteUpcomingSubscription = async (
  clientId: number,
  subscriptionId: number,
  actor: Actor,
  transaction?: Transaction,
): Promise<Subscription | null> => {
  const subscription = await Subscription.findOne({ where: { id: subscriptionId, clientId } });
  if (!subscription) return null;

  const today = appToday();
  const isUpcoming =
    !subscription.finalizedAt && (!subscription.startDate || subscription.startDate > today);
  if (!isUpcoming) {
    throw new ConflictError('Solo puedes eliminar una renovación que aún no ha empezado.');
  }

  await withTransaction(transaction, async (t) => {
    // Counted inside the transaction so the guard sees plans the same workflow already finalized —
    // outside it, one of those would still read as running and the last renewal could be deleted.
    const runningPlans = await Subscription.count({
      where: {
        clientId,
        finalizedAt: null,
        startDate: { [Op.lte]: today },
        contractEndDate: { [Op.gte]: today },
      },
      transaction: t,
    });
    if (runningPlans === 0) {
      throw new ConflictError(
        'El cliente no tiene un plan en curso. Finaliza o elimina al cliente en lugar de eliminar su única suscripción.',
      );
    }

    const plan = await Plan.findByPk(subscription.planId, { transaction: t });

    // An appointment that resolved into this renewal is unlinked by the foreign key, not here:
    // appointments belongs to evaluation. Only the link is cleared, never the date, so a past
    // appointment is pruned on the next queue read rather than pushed back onto the
    // nutritionist's list.
    await subscription.destroy({ transaction: t });

    await record(
      actor,
      {
        type: 'renewal_deleted',
        clientId,
        metadata: {
          planId: subscription.planId,
          planName: plan?.name ?? null,
          startDate: subscription.startDate,
          contractEndDate: subscription.contractEndDate,
          duration: subscription.duration,
          discount: subscription.discount,
          // the history row names the moment the renewal was registered, which is what ties it to
          // the plan_renewed entry above it — that entry is never modified
          registeredAt: subscription.createdAt,
        },
      },
      t,
    );
  });

  return subscription;
};
