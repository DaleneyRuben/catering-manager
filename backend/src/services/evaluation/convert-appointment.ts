import Appointment from '../../models/Appointment';
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

  const client = await createClient(clientData);
  const subscription = await createSubscription(client.id, subscriptionData, actor);
  if (!subscription) return null;
  await appointment.update({ subscriptionId: subscription.id });

  return { client, subscription };
};
