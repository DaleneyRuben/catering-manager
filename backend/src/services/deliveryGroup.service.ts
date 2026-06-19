import { Op } from 'sequelize';
import { randomUUID } from 'crypto';
import Client from '../models/Client';

const setGroup = async (clientId: number, memberIds: number[]): Promise<void> => {
  const client = await Client.findByPk(clientId);
  if (!client) throw new Error(`Client ${clientId} not found`);

  const oldToken = client.groupToken;

  if (memberIds.length === 0) {
    if (!oldToken) return;
    await client.update({ groupToken: null });
    const remaining = await Client.count({ where: { groupToken: oldToken } });
    if (remaining === 1) {
      await Client.update({ groupToken: null }, { where: { groupToken: oldToken } });
    }
    return;
  }

  // Reuse existing token — never change it unnecessarily
  const token = oldToken ?? randomUUID();
  if (!oldToken) {
    await client.update({ groupToken: token });
  }

  // Evict old group members no longer in the new list
  if (oldToken) {
    await Client.update(
      { groupToken: null },
      { where: { groupToken: oldToken, id: { [Op.notIn]: [...memberIds, clientId] } } },
    );
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
