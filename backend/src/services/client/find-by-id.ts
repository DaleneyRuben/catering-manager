import Client from '../../models/Client';
import { findMembers } from '../delivery/find-members';
import { withStatus, INCLUDE_SUBSCRIPTION_ORDERED } from './_helpers';

export const findById = async (id: number) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;
  const base = withStatus(client);
  const groupMembers = client.groupToken
    ? (await findMembers(client.groupToken)).filter((m) => m.id !== id)
    : [];
  return { ...base, groupMembers };
};
