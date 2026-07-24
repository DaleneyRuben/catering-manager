import { CreateClientDto } from '../../schemas/client.schema';
import { CreateSubscriptionDto } from '../../schemas/subscription.schema';

export const convertAppointment = async (
  _appointmentId: number,
  _clientData: CreateClientDto,
  _subscriptionData: CreateSubscriptionDto,
) => {
  throw new Error('not implemented');
};
