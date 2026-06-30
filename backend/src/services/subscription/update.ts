import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import Subscription from '../../models/Subscription';
import { UpdateSubscriptionDto } from '../../schemas/subscription.schema';
import { addDeliveryDays, subtractDeliveryDays, calcContractEndDate } from '../../utils/date';

export const update = async (clientId: number, id: number, data: UpdateSubscriptionDto) => {
  const subscription = await Subscription.findOne({ where: { id, clientId } });
  if (!subscription) return null;

  const { suspendedDates, contractDate, startDate, duration, ...rest } = data;
  const base: Record<string, unknown> = { ...rest };
  if (contractDate !== undefined) base.contractDate = contractDate;

  if (startDate !== undefined || duration !== undefined) {
    const newStartDate = startDate ?? subscription.startDate;
    const newDuration = duration ?? subscription.duration;

    const newContractEndDate = calcContractEndDate(newStartDate ?? null, newDuration);

    const cleanedSuspendedDates = newStartDate
      ? (subscription.suspendedDates ?? []).filter((d) => d >= newStartDate)
      : [];

    if (startDate !== undefined) base.startDate = startDate;
    if (duration !== undefined) base.duration = duration;
    base.contractEndDate = newContractEndDate;
    base.suspendedDates = cleanedSuspendedDates;

    // assigning a start date activates a sin-fecha paused client
    if (startDate) {
      const client = await Client.findByPk(clientId);
      if (client) await client.update({ pausedSince: null });
    }

    await ClientHistory.create({
      clientId: subscription.clientId,
      eventType: 'plan_assigned',
      occurredAt: new Date(),
      metadata: {
        startDate: newStartDate,
        duration: newDuration,
        contractEndDate: newContractEndDate,
      },
    });

    return subscription.update(base);
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

    if (added.length > 0) {
      await ClientHistory.create({
        clientId: subscription.clientId,
        eventType: 'suspended',
        occurredAt: new Date(),
        metadata: { dates: added },
      });
    }

    return subscription.update({ ...base, suspendedDates, contractEndDate });
  }

  return subscription.update(base);
};
