import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import type { Actor } from '../../types/actor';

export const softDelete = async (id: number, actor: Actor) => {
  const client = await Client.findByPk(id);
  if (!client) return null;

  await client.destroy();
  await ClientHistory.create({
    clientId: id,
    eventType: 'deleted',
    occurredAt: new Date(),
    metadata: {},
    userId: actor.userId,
    username: actor.username,
  });

  return client;
};
