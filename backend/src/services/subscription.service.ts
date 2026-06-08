import Client from '../models/Client';
import ClientHistory from '../models/ClientHistory';
import Subscription from '../models/Subscription';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '../schemas/subscription.schema';
import { addDeliveryDays, subtractDeliveryDays } from '../utils/date';

// TODO: restore contractDate === today validation once backfilling of existing clients is complete
const create = async (clientId: number, data: CreateSubscriptionDto) => {
  const client = await Client.findByPk(clientId);
  if (!client) return null;

  // duration - 1 because startDate counts as day 1
  const contractEndDate = addDeliveryDays(data.startDate, data.duration - 1);

  return Subscription.create({
    planId: data.planId,
    startDate: data.startDate,
    contractDate: data.contractDate,
    discount: data.discount ?? 0,
    contractEndDate,
    clientId,
  } as never);
};

const update = async (clientId: number, id: number, data: UpdateSubscriptionDto) => {
  const subscription = await Subscription.findOne({ where: { id, clientId } });
  if (!subscription) return null;

  const { suspendedDates, contractDate, startDate, duration, ...rest } = data;
  const base: Record<string, unknown> = { ...rest };
  if (contractDate !== undefined) base.contractDate = contractDate;

  if (startDate !== undefined || duration !== undefined) {
    const newStartDate = startDate ?? subscription.startDate;
    const newDuration = duration ?? subscription.duration;
    // duration - 1 because startDate counts as day 1
    const newContractEndDate = addDeliveryDays(newStartDate, newDuration - 1);
    const cleanedSuspendedDates = (subscription.suspendedDates ?? []).filter(
      (d) => d >= newStartDate,
    );

    if (startDate !== undefined) base.startDate = startDate;
    if (duration !== undefined) base.duration = duration;
    base.contractEndDate = newContractEndDate;
    base.suspendedDates = cleanedSuspendedDates;

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
    if (net > 0) contractEndDate = addDeliveryDays(contractEndDate, net);
    else if (net < 0) contractEndDate = subtractDeliveryDays(contractEndDate, Math.abs(net));

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

export default { create, update };
