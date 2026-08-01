import { differenceInBusinessDays, parseISO } from 'date-fns';
import Client from '../../models/Client';
import { UpdateClientDto } from '../../schemas/client.schema';
import type { Actor } from '../../types/actor';
import { appToday, addDeliveryDays, toAppDate } from '../../utils/date';
import { record } from '../client-history';
import { withStatus, getCurrentSubscription, INCLUDE_SUBSCRIPTION_ORDERED } from './_helpers';

type SubLike = {
  id: number;
  paid?: boolean;
  startDate: string | null;
  contractEndDate?: string | null;
  finalizedAt?: string | null;
  duration: number;
  update: (d: object) => Promise<void>;
};

export const update = async (id: number, data: UpdateClientDto, actor: Actor) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  if (data.pausedSince !== undefined) {
    const isPausing = data.pausedSince !== null && client.pausedSince === null;
    const isResuming = data.pausedSince === null && client.pausedSince !== null;

    if (isPausing || isResuming) {
      await record(actor, { type: isPausing ? 'paused' : 'resumed', clientId: client.id });
    }

    if (isResuming && client.pausedSince) {
      const subs = (client as never as { subscriptions: SubLike[] }).subscriptions ?? [];
      const sub = getCurrentSubscription(subs, appToday());
      if (sub?.startDate) {
        const pausedDateStr = toAppDate(client.pausedSince);
        const elapsed = differenceInBusinessDays(
          parseISO(`${pausedDateStr}T12:00:00`),
          parseISO(`${sub.startDate}T12:00:00`),
        );
        const remaining = sub.duration - elapsed;
        if (remaining > 0) {
          const newContractEndDate = addDeliveryDays(appToday(), remaining);
          await sub.update({ contractEndDate: newContractEndDate });
        }
      }
    }
  }

  const updated = await client.update(data);
  return withStatus(updated);
};
