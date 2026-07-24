import ClientHistory from '../../models/ClientHistory';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';

export const markPaid = async (clientId: number) => {
  const subscription = await Subscription.findOne({ where: { clientId, paid: false } });
  if (!subscription) return null;

  await subscription.update({ paid: true });

  const plan = await Plan.findByPk(subscription.planId);
  await ClientHistory.create({
    clientId,
    eventType: 'plan_assigned',
    occurredAt: new Date(),
    metadata: {
      planId: subscription.planId,
      planName: plan?.name ?? null,
      planPrice: plan?.price ?? null,
      startDate: subscription.startDate,
      duration: subscription.duration,
      contractEndDate: subscription.contractEndDate,
      discount: subscription.discount,
    },
  });

  return subscription;
};
