import { Transaction } from 'sequelize';
import Subscription from '../../models/Subscription';
import { withTransaction } from '../../database/with-transaction';
import { UpdateSubscriptionDto } from '../../schemas/subscription.schema';
import type { Actor } from '../../types/actor';
import { addDeliveryDays, subtractDeliveryDays, calcContractEndDate } from '../../utils/date';
import { record } from '../client-history';
import { finalizeOverlappingSubscriptions } from './finalize-overlapping';

export const update = async (
  clientId: number,
  id: number,
  data: UpdateSubscriptionDto,
  actor: Actor,
  transaction?: Transaction,
) => {
  const subscription = await Subscription.findOne({ where: { id, clientId } });
  if (!subscription) return null;

  const { suspendedDates, contractDate, startDate, duration, ...rest } = data;
  const base: Record<string, unknown> = { ...rest };
  if (contractDate !== undefined) base.contractDate = contractDate;

  return withTransaction(transaction, async (t) => {
    if (startDate !== undefined || duration !== undefined) {
      const newStartDate = startDate ?? subscription.startDate;
      const newDuration = duration ?? subscription.duration;

      const baseContractEndDate = calcContractEndDate(newStartDate ?? null, newDuration);

      const cleanedSuspendedDates = newStartDate
        ? (subscription.suspendedDates ?? []).filter((d) => d >= newStartDate)
        : [];

      const newContractEndDate =
        baseContractEndDate && cleanedSuspendedDates.length > 0
          ? addDeliveryDays(baseContractEndDate, cleanedSuspendedDates.length)
          : baseContractEndDate;

      if (startDate !== undefined) base.startDate = startDate;
      if (duration !== undefined) base.duration = duration;
      base.contractEndDate = newContractEndDate;
      base.suspendedDates = cleanedSuspendedDates;

      // assigning a start date activates this sin-fecha renewal — and only this one
      if (startDate) {
        await finalizeOverlappingSubscriptions(clientId, startDate, subscription.id, t);
        base.pausedSince = null;
      }

      const updated = await subscription.update(base, { transaction: t });

      // recorded after the write it describes, so a failed update leaves no orphan event
      await record(
        actor,
        {
          type: 'plan_assigned',
          clientId: subscription.clientId,
          metadata: {
            startDate: newStartDate,
            duration: newDuration,
            contractEndDate: newContractEndDate,
          },
        },
        t,
      );

      return updated;
    }

    if (suspendedDates !== undefined) {
      const current = subscription.suspendedDates ?? [];
      const added = suspendedDates.filter((d) => !current.includes(d));
      const removed = current.filter((d) => !suspendedDates.includes(d));

      const net = added.length - removed.length;
      let { contractEndDate } = subscription;
      if (contractEndDate) {
        if (net > 0) contractEndDate = addDeliveryDays(contractEndDate, net);
        else if (net < 0) contractEndDate = subtractDeliveryDays(contractEndDate, Math.abs(net));
      }

      const updated = await subscription.update(
        { ...base, suspendedDates, contractEndDate },
        { transaction: t },
      );

      if (added.length > 0) {
        await record(
          actor,
          {
            type: 'suspended',
            clientId: subscription.clientId,
            metadata: { dates: added },
          },
          t,
        );
      }

      return updated;
    }

    return subscription.update(base, { transaction: t });
  });
};
