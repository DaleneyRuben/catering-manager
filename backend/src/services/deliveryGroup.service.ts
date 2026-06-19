import { randomUUID } from 'crypto';
import Client from '../models/Client';

const link = async (clientId: number, targetClientId: number): Promise<void> => {
  const [client, target] = await Promise.all([
    Client.findByPk(clientId),
    Client.findByPk(targetClientId),
  ]);

  if (!client) throw new Error(`Client ${clientId} not found`);
  if (!target) throw new Error(`Client ${targetClientId} not found`);

  if (client.groupToken && client.groupToken === target.groupToken) return;

  if (!client.groupToken && !target.groupToken) {
    const token = randomUUID();
    await client.update({ groupToken: token });
    await target.update({ groupToken: token });
    return;
  }

  if (client.groupToken && target.groupToken) {
    await Client.update(
      { groupToken: client.groupToken },
      { where: { groupToken: target.groupToken } },
    );
    return;
  }

  if (target.groupToken) {
    await client.update({ groupToken: target.groupToken });
  } else {
    await target.update({ groupToken: client.groupToken });
  }
};

const unlink = async (clientId: number): Promise<void> => {
  const client = await Client.findByPk(clientId);
  if (!client) throw new Error(`Client ${clientId} not found`);
  if (!client.groupToken) return;

  const token = client.groupToken;
  await client.update({ groupToken: null });

  const remaining = await Client.count({ where: { groupToken: token } });
  if (remaining === 1) {
    await Client.update({ groupToken: null }, { where: { groupToken: token } });
  }
};

const findMembers = async (groupToken: string): Promise<{ id: number; name: string }[]> => {
  const clients = await Client.findAll({
    where: { groupToken },
    attributes: ['id', 'name'],
  });
  return clients.map((c) => ({ id: c.id, name: c.name }));
};

export default { link, unlink, findMembers };
