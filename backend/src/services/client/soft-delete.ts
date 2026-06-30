import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';

export const softDelete = async (id: number) => {
  const client = await Client.findByPk(id);
  if (!client) return null;

  await client.destroy();
  await ClientHistory.create({
    clientId: id,
    eventType: 'deleted',
    occurredAt: new Date(),
    metadata: {},
  });

  return client;
};
