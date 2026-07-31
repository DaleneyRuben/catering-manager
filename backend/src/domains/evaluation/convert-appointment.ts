import Appointment from '../../models/Appointment';
import sequelize from '../../database/sequelize';
import { CreateClientDto } from '../../schemas/client.schema';
import { CreateSubscriptionDto } from '../../schemas/subscription.schema';
import type { Actor } from '../../types/actor';
import { create as createClient } from '../client';
import { create as createSubscription } from '../subscription';

export const convertAppointment = async (
  appointmentId: number,
  clientData: CreateClientDto,
  subscriptionData: CreateSubscriptionDto,
  actor: Actor,
) => {
  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment || appointment.subscriptionId) return null;

  return sequelize.transaction(async (transaction) => {
    const client = await createClient(clientData, transaction);
    const subscription = await createSubscription(
      client.id,
      { ...subscriptionData, appointmentId },
      actor,
      transaction,
    );
    if (!subscription) return null;

    await appointment.update({ subscriptionId: subscription.id }, { transaction });
    return { client, subscription };
  });
};
