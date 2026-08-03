import { Transaction } from 'sequelize';
import Client from '../../models/Client';
import { withTransaction } from '../../database/with-transaction';
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

export const finalize = async (id: number, actor: Actor, transaction?: Transaction) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  const today = appToday();
  const subs = (client as never as { subscriptions: SubLike[] }).subscriptions ?? [];
  const sub = getCurrentSubscription(subs, today);

  await withTransaction(transaction, async (t) => {
    if (sub) await finalizeSubscription(sub.id, t);

    // Recorded even when there is no subscription to end: the client was still finalized.
    await record(actor, { type: 'finalized', clientId: client.id }, t);
  });

  return withStatus(client);
};
