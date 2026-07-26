import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import type { Actor } from '../../types/actor';
import { appToday } from '../../utils/date';
import { withStatus, INCLUDE_SUBSCRIPTION_ORDERED, getPrimarySubscription } from './_helpers';

export const finalize = async (id: number, actor: Actor) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  const subs =
    (
      client as never as {
        subscriptions: { id: number; paid?: boolean; update: (d: object) => Promise<void> }[];
      }
    ).subscriptions ?? [];
  const sub = getPrimarySubscription(subs);

  const today = appToday();
  if (sub) await sub.update({ contractEndDate: today, finalizedAt: today });

  await ClientHistory.create({
    clientId: client.id,
    eventType: 'finalized',
    occurredAt: new Date(),
    metadata: {},
    userId: actor.userId,
    username: actor.username,
  });

  return withStatus(client);
};
