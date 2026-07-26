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

  const pendingUnpaid = await Subscription.findOne({ where: { clientId, paid: false } });
  if (pendingUnpaid) return { subscription: null, reason: 'already_pending' };

  return sequelize.transaction(async (transaction) => {
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
};
