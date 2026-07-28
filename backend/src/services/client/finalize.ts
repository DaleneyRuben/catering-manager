import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import type { Actor } from '../../types/actor';
import { appToday } from '../../utils/date';
import { withStatus, getCurrentSubscription, INCLUDE_SUBSCRIPTION_ORDERED } from './_helpers';

type SubLike = {
  id: number;
  startDate?: string | null;
  contractEndDate?: string | null;
  finalizedAt?: string | null;
  update: (d: object) => Promise<void>;
};

export const finalize = async (id: number, actor: Actor) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  const today = appToday();
  const subs = (client as never as { subscriptions: SubLike[] }).subscriptions ?? [];
  const sub = getCurrentSubscription(subs, today);

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
