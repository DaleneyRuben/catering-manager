import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';

export const findByClient = async (clientId: number) => {
  const client = await Client.findByPk(clientId);
  if (!client) return null;

  return ClientHistory.findAll({
    where: { clientId },
    order: [['occurredAt', 'DESC']],
  });
};
