import Client from '../../models/Client';
import type { Actor } from '../../types/actor';
import { appToday } from '../../utils/date';
import { record } from '../client-history';
import { finalize as finalizeSubscription } from '../subscription';
import { withStatus, getCurrentSubscription, INCLUDE_SUBSCRIPTION_ORDERED } from './_helpers';

type SubLike = {
  id: number;
  paid?: boolean;
  startDate?: string | null;
  contractEndDate?: string | null;
  finalizedAt?: string | null;
};

export const finalize = async (id: number, actor: Actor) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  const today = appToday();
  const subs = (client as never as { subscriptions: SubLike[] }).subscriptions ?? [];
  const sub = getCurrentSubscription(subs, today);

  if (sub) await finalizeSubscription(sub.id);

  // Recorded even when there is no subscription to end: the client was still finalized.
  await record(actor, { type: 'finalized', clientId: client.id });

  return withStatus(client);
};
