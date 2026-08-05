import { Transaction } from 'sequelize';
import { HISTORY_EVENTS } from '../../constants/history.constants';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { withTransaction } from '../../database/with-transaction';
import { UpdateSubscriptionDto } from '../../schemas/subscription.schema';
import type { Actor } from '../../types/actor';
import { addDeliveryDays, subtractDeliveryDays, calcContractEndDate } from '../../utils/date';
import { record } from '../client-history';
import { finalizeOverlappingSubscriptions } from './finalize-overlapping';

type PlanChange = {
  planId: number;
  planName: string | null;
  planPrice: number | null;
  previousPlanId: number;
  previousPlanName: string | null;
  price: number;
  previousPrice: number;
};

// Resolved before the write it describes and inside the transaction: the previous plan and price
// are unreadable once the update lands.
const resolvePlanChange = async (
  subscription: Subscription,
  data: UpdateSubscriptionDto,
  transaction: Transaction,
): Promise<PlanChange | null> => {
  const planId = data.planId ?? subscription.planId;
  // pg returns DECIMAL as a string, so the stored price needs coercing before either the
  // comparison below or the metadata can treat it as a number
  const previousPrice = Number(subscription.price);
  const price = data.price ?? previousPrice;
  if (planId === subscription.planId && price === previousPrice) return null;

  const previousPlan = await Plan.findByPk(subscription.planId, { transaction });
  const plan =
    planId === subscription.planId ? previousPlan : await Plan.findByPk(planId, { transaction });

  return {
    planId,
    planName: plan?.name ?? null,
    planPrice: plan?.price ?? null,
    previousPlanId: subscription.planId,
    previousPlanName: previousPlan?.name ?? null,
    price,
    previousPrice,
  };
};

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
    const planChange = await resolvePlanChange(subscription, data, t);

    // The commercial terms can move alongside any of the branches below — one PATCH may carry both
    // a new plan and new contract dates — so all three return through here.
    const finish = async <T>(updated: T): Promise<T> => {
      if (planChange) {
        await record(
          actor,
          {
            type: HISTORY_EVENTS.TERMS_CHANGED,
            clientId: subscription.clientId,
            metadata: planChange,
          },
          t,
        );
      }
      return updated;
    };

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
          type: HISTORY_EVENTS.DATES_CHANGED,
          clientId: subscription.clientId,
          metadata: {
            startDate: newStartDate,
            duration: newDuration,
            contractEndDate: newContractEndDate,
          },
        },
        t,
      );

      return finish(updated);
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
            type: HISTORY_EVENTS.DAYS_SUSPENDED,
            clientId: subscription.clientId,
            metadata: { dates: added },
          },
          t,
        );
      }

      return finish(updated);
    }

    return finish(await subscription.update(base, { transaction: t }));
  });
};
