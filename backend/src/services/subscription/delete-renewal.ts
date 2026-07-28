import ClientHistory from '../../models/ClientHistory';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';
import { ConflictError } from '../../utils/errors';

// Only a renewal registered ahead of time can be removed: the running plan is ended with
// Finalizar plan, and a client whose single subscription is still upcoming keeps it — deleting
// it would leave them with no plan at all instead of one that ended.
export const deleteRenewal = async (
  clientId: number,
  subscriptionId: number,
): Promise<Subscription | null> => {
  const subscription = await Subscription.findOne({ where: { id: subscriptionId, clientId } });
  if (!subscription) return null;

  const today = appToday();
  const isUpcoming =
    !subscription.finalizedAt && (!subscription.startDate || subscription.startDate > today);
  if (!isUpcoming) {
    throw new ConflictError('Solo puedes eliminar una renovación que aún no ha empezado.');
  }

  if ((await Subscription.count({ where: { clientId } })) < 2) {
    throw new ConflictError(
      'El cliente no tiene otro plan. Finaliza o elimina al cliente en lugar de eliminar su única suscripción.',
    );
  }

  const plan = await Plan.findByPk(subscription.planId);
  await subscription.destroy();

  await ClientHistory.create({
    clientId,
    eventType: 'renewal_deleted',
    occurredAt: new Date(),
    metadata: {
      planId: subscription.planId,
      planName: plan?.name ?? null,
      startDate: subscription.startDate,
      contractEndDate: subscription.contractEndDate,
      duration: subscription.duration,
      discount: subscription.discount,
    },
  });

  return subscription;
};
