import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { CreateSubscriptionDto } from '../../schemas/subscription.schema';
import type { Actor } from '../../types/actor';
import { appToday, calcContractEndDate } from '../../utils/date';
import { ConflictError } from '../../utils/errors';
import { finalizeOverlappingSubscriptions, findUpcomingSubscription } from './_helpers';

// TODO: restore contractDate === today validation once backfilling of existing clients is complete
export const create = async (clientId: number, data: CreateSubscriptionDto, actor: Actor) => {
  const client = await Client.findByPk(clientId);
  if (!client) return null;

  const today = appToday();

  if (await findUpcomingSubscription(clientId, today)) {
    throw new ConflictError(
      'El cliente ya tiene una renovación registrada. Elimínala para registrar otra.',
    );
  }

  const contractEndDate = calcContractEndDate(data.startDate ?? null, data.duration);

  if (data.startDate) await finalizeOverlappingSubscriptions(clientId, data.startDate);

  const subscription = await Subscription.create({
    planId: data.planId,
    startDate: data.startDate ?? null,
    contractDate: data.contractDate,
    discount: data.discount ?? 0,
    duration: data.duration,
    contractEndDate,
    clientId,
    paid: data.paid ?? true,
    ...(data.specialInstructions ? { specialInstructions: data.specialInstructions } : {}),
  } as never);

  const eventTypeByRenewal = {
    reactivation: 'reactivated',
    renewal: 'plan_renewed',
  } as const;
  const eventType = data.renewalType ? eventTypeByRenewal[data.renewalType] : 'plan_assigned';

  // unpaid conversions defer plan_assigned until an admin marks the subscription paid
  const shouldLogHistory = eventType !== 'plan_assigned' || (data.paid ?? true);
  if (shouldLogHistory) {
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
      userId: actor.userId,
      username: actor.username,
    });
  }

  if (data.renewalType === 'reactivation') {
    await client.update({ pausedSince: null });
  } else if (data.renewalType === 'renewal' && !data.startDate) {
    // sin fecha renewal: pause the client until a start date is manually assigned
    await client.update({ pausedSince: today });
  }

  return subscription;
};
