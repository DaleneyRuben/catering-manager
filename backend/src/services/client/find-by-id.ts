import Client from '../../models/Client';
import { findMembers } from '../delivery';
import { withStatus, INCLUDE_SUBSCRIPTION_ORDERED } from './_helpers';

export const findById = async (id: number) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: any[] = client.subscriptions ?? [];
  const latestSub = [...subs].sort((a, b) => b.id - a.id)[0];
  if (subs.length === 1 && latestSub.paid === false) return null;
  const base = withStatus(client);
  const groupMembers = client.groupToken
    ? (await findMembers(client.groupToken)).filter((m) => m.id !== id)
    : [];
  return { ...base, groupMembers };
};
