import { randomUUID } from 'crypto';
import Client from '../models/Client';

const setGroup = async (clientId: number, memberIds: number[]): Promise<void> => {
  const client = await Client.findByPk(clientId);
  if (!client) throw new Error(`Client ${clientId} not found`);

  const oldToken = client.groupToken;
  let currentToken = oldToken;

  // If client is in a group with others and is being reassigned, leave the old group
  if (oldToken && memberIds.length > 0) {
    const groupSize = await Client.count({ where: { groupToken: oldToken } });
    if (groupSize > 1) {
      await client.update({ groupToken: null });
      currentToken = null;
      const remaining = await Client.count({ where: { groupToken: oldToken } });
      if (remaining === 1) {
        await Client.update({ groupToken: null }, { where: { groupToken: oldToken } });
      }
    }
  }

  // Clear client from group entirely
  if (memberIds.length === 0) {
    if (!oldToken) return;
    await client.update({ groupToken: null });
    const remaining = await Client.count({ where: { groupToken: oldToken } });
    if (remaining === 1) {
      await Client.update({ groupToken: null }, { where: { groupToken: oldToken } });
    }
    return;
  }

  // Assign token to all new members — reuse client's current token or generate a new one
  const token = currentToken ?? randomUUID();
  if (!currentToken) {
    await client.update({ groupToken: token });
  }
  await Client.update({ groupToken: token }, { where: { id: memberIds } });
};

const findMembers = async (groupToken: string): Promise<{ id: number; name: string }[]> => {
  const clients = await Client.findAll({
    where: { groupToken },
    attributes: ['id', 'name'],
  });
  return clients.map((c) => ({ id: c.id, name: c.name }));
};

export default { setGroup, findMembers };
