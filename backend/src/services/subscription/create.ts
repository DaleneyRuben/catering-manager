import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { CreateSubscriptionDto } from '../../schemas/subscription.schema';
import { appToday, calcContractEndDate } from '../../utils/date';

// TODO: restore contractDate === today validation once backfilling of existing clients is complete
export const create = async (clientId: number, data: CreateSubscriptionDto) => {
  const client = await Client.findByPk(clientId);
  if (!client) return null;

  const today = appToday();

  const contractEndDate = calcContractEndDate(data.startDate ?? null, data.duration);

  const subscription = await Subscription.create({
    planId: data.planId,
    startDate: data.startDate ?? null,
    contractDate: data.contractDate,
    discount: data.discount ?? 0,
    duration: data.duration,
    contractEndDate,
    clientId,
    ...(data.specialInstructions ? { specialInstructions: data.specialInstructions } : {}),
  } as never);

  const eventTypeByRenewal = {
    reactivation: 'reactivated',
    renewal: 'plan_renewed',
  } as const;
  const eventType = data.renewalType ? eventTypeByRenewal[data.renewalType] : 'plan_assigned';

  const plan = await Plan.findByPk(data.planId);
  await ClientHistory.create({
    clientId,
    eventType,
    occurredAt: new Date(),
    metadata: {
      planId: data.planId,
      planName: plan?.name ?? null,
      planPrice: plan?.price ?? null,
      startDate: data.startDate ?? null,
      duration: data.duration,
      contractEndDate,
      discount: data.discount ?? 0,
    },
  });

  if (data.renewalType === 'reactivation') {
    await client.update({ pausedSince: null });
  } else if (data.renewalType === 'renewal' && !data.startDate) {
    // sin fecha renewal: pause the client until a start date is manually assigned
    await client.update({ pausedSince: today });
  }

  return subscription;
};
