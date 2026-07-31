import Client from '../../models/Client';

export const findMembers = async (groupToken: string): Promise<{ id: number; name: string }[]> => {
  const clients = await Client.findAll({
    where: { groupToken },
    attributes: ['id', 'name'],
  });
  return clients.map((c) => ({ id: c.id, name: c.name }));
};
