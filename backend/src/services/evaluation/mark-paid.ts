import ClientHistory from '../../models/ClientHistory';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';

export const markPaid = async (clientId: number) => {
  const subscription = await Subscription.findOne({ where: { clientId, paid: false } });
  if (!subscription) return null;

  await subscription.update({ paid: true });

  const eventTypeByRenewal = {
    reactivation: 'reactivated',
    renewal: 'plan_renewed',
  } as const;
  const eventType = subscription.renewalType
    ? eventTypeByRenewal[subscription.renewalType as 'renewal' | 'reactivation']
    : 'plan_assigned';

  const plan = await Plan.findByPk(subscription.planId);
  await ClientHistory.create({
    clientId,
    eventType,
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
