import { Transaction } from 'sequelize';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { CreateSubscriptionDto } from '../../schemas/subscription.schema';
import type { Actor } from '../../types/actor';
import { appToday, calcContractEndDate } from '../../utils/date';
import { ConflictError } from '../../utils/errors';
import { record } from '../client-history';
import { finalizeOverlappingSubscriptions } from './finalize-overlapping';
import { applyRenewalPauseState, findUpcomingSubscription, historyEventTypeFor } from './_helpers';

// TODO: restore contractDate === today validation once backfilling of existing clients is complete
export const create = async (
  clientId: number,
  data: CreateSubscriptionDto,
  actor: Actor,
  transaction?: Transaction,
) => {
  const client = transaction
    ? await Client.findByPk(clientId, { transaction })
    : await Client.findByPk(clientId);
  if (!client) return null;

  const today = appToday();
  const paid = data.paid ?? true;

  if (await findUpcomingSubscription(clientId, today)) {
    throw new ConflictError(
      'El cliente ya tiene una renovación registrada. Elimínala para registrar otra.',
    );
  }

  const contractEndDate = calcContractEndDate(data.startDate ?? null, data.duration);

  // While unpaid, this subscription "isn't real yet" (see ADR-004/005): side effects on
  // other state are deferred to markPaid so an abandoned unpaid renewal never has anything
  // else to undo.
  if (paid && data.startDate) {
    await finalizeOverlappingSubscriptions(clientId, data.startDate, undefined, transaction);
  }

  const subscriptionData = {
    planId: data.planId,
    startDate: data.startDate ?? null,
    contractDate: data.contractDate,
    discount: data.discount ?? 0,
    duration: data.duration,
    contractEndDate,
    clientId,
    paid,
    renewalType: data.renewalType ?? null,
    appointmentId: data.appointmentId ?? null,
    ...(data.specialInstructions ? { specialInstructions: data.specialInstructions } : {}),
  } as never;
  const subscription = transaction
    ? await Subscription.create(subscriptionData, { transaction })
    : await Subscription.create(subscriptionData);

  const eventType = historyEventTypeFor(data.renewalType ?? null);

  // unpaid subscriptions of any kind defer their history write until an admin marks them paid
  if (paid) {
    const plan = transaction
      ? await Plan.findByPk(data.planId, { transaction })
      : await Plan.findByPk(data.planId);
    await record(
      actor,
      {
        type: eventType,
        clientId,
        metadata: {
          planId: data.planId,
          planName: plan?.name ?? null,
          planPrice: plan?.price ?? null,
          startDate: data.startDate ?? null,
          duration: data.duration,
          contractEndDate,
          discount: data.discount ?? 0,
          ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
        },
      },
      transaction,
    );
  }

  if (paid) {
    await applyRenewalPauseState(
      subscription,
      data.renewalType ?? null,
      data.startDate ?? null,
      transaction,
    );
  }

  return subscription;
};
