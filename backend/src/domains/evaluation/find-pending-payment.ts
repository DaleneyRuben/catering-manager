import Appointment from '../../models/Appointment';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';

export const findPendingPayment = async () => {
  const clients = await Client.findAll({
    include: [{ model: Subscription, include: [Plan], required: true, where: { paid: false } }],
    order: [['createdAt', 'DESC']],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plainClients: any[] = clients.map((client: any) => client.toJSON());
  const subscriptionIds = plainClients.flatMap((client) =>
    client.subscriptions.map((s: { id: number }) => s.id),
  );

  const appointments = subscriptionIds.length
    ? await Appointment.findAll({ where: { subscriptionId: subscriptionIds } })
    : [];
  const existingClientSubscriptionIds = new Set(
    appointments.filter((a) => a.clientId != null).map((a) => a.subscriptionId),
  );

  return plainClients.map((client) => ({
    ...client,
    isExistingClientRenewal: client.subscriptions.some((s: { id: number }) =>
      existingClientSubscriptionIds.has(s.id),
    ),
  }));
};
