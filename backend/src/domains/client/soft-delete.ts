import Client from '../../models/Client';
import type { Actor } from '../../types/actor';
import { record } from '../client-history';

export const softDelete = async (id: number, actor: Actor) => {
  const client = await Client.findByPk(id);
  if (!client) return null;

  await client.destroy();
  await record(actor, { type: 'deleted', clientId: id });

  return client;
};
