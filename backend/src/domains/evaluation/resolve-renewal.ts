import { UniqueConstraintError } from 'sequelize';
import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import sequelize from '../../database/sequelize';
import { CreateSubscriptionDto } from '../../schemas/subscription.schema';
import type { Actor } from '../../types/actor';
import { create as createSubscription } from '../subscription';

export type ResolveRenewalResult =
  | { subscription: Subscription; reason?: undefined }
  | { subscription: null; reason: 'already_pending' };

export const resolveRenewal = async (
  appointmentId: number,
  subscriptionData: CreateSubscriptionDto,
  actor: Actor,
): Promise<ResolveRenewalResult | null> => {
  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment || !appointment.clientId || appointment.subscriptionId) return null;

  const clientId = appointment.clientId as number;

  // Fast path: avoids a wasted transaction in the common case. Not sufficient on its own —
  // two near-simultaneous requests could both pass this check before either commits, so the
  // db-level unique index (see migration add-unique-unpaid-subscription-per-client) is the
  // real guarantee; a violation of it is caught below and reported the same way.
  const pendingUnpaid = await Subscription.findOne({ where: { clientId, paid: false } });
  if (pendingUnpaid) return { subscription: null, reason: 'already_pending' };

  try {
    return await sequelize.transaction(async (transaction) => {
      const subscription = await createSubscription(
        clientId,
        { ...subscriptionData, appointmentId },
        actor,
        transaction,
      );
      if (!subscription) return null;

      await appointment.update({ subscriptionId: subscription.id }, { transaction });
      return { subscription };
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError)
      return { subscription: null, reason: 'already_pending' };
    throw err;
  }
};
