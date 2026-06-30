import { differenceInBusinessDays, parseISO } from 'date-fns';
import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import { UpdateClientDto } from '../../schemas/client.schema';
import { appToday, addDeliveryDays, toAppDate } from '../../utils/date';
import { withStatus, INCLUDE_SUBSCRIPTION_ORDERED } from './_helpers';

type SubLike = {
  startDate: string | null;
  duration: number;
  update: (d: object) => Promise<void>;
};

export const update = async (id: number, data: UpdateClientDto) => {
  const client = await Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION_ORDERED });
  if (!client) return null;

  if (data.pausedSince !== undefined) {
    const isPausing = data.pausedSince !== null && client.pausedSince === null;
    const isResuming = data.pausedSince === null && client.pausedSince !== null;

    if (isPausing || isResuming) {
      await ClientHistory.create({
        clientId: client.id,
        eventType: isPausing ? 'paused' : 'resumed',
        occurredAt: new Date(),
        metadata: {},
      });
    }

    if (isResuming && client.pausedSince) {
      const subs = (client as never as { subscriptions: SubLike[] }).subscriptions ?? [];
      const sub = subs[0];
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
