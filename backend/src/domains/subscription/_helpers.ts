import { Op, Transaction } from 'sequelize';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';

// Shared by findActiveSubscriptionsForDate and findSuspendedSubscriptionsForDate: subscriptions
// whose date range covers `date`, for a non-paused client, excluding finalized ones. Suspension
// on `date` is not filtered here — callers split the result by suspendedDates themselves.
export const findContractActiveSubscriptions = async (date: string): Promise<Subscription[]> =>
  Subscription.findAll({
    where: {
      startDate: { [Op.lte]: date },
      contractEndDate: { [Op.gte]: date },
      finalizedAt: { [Op.is]: null },
      paid: true,
    },
    include: [{ model: Client, where: { pausedSince: null } }, { model: Plan }],
    order: [['createdAt', 'ASC']],
  });

type RenewalType = 'renewal' | 'reactivation' | null;

type PausableClient = {
  pausedSince: Date | string | null;
  update: (data: object, options?: { transaction: Transaction }) => Promise<unknown>;
};

// A renewal moves the client's pause state, and the rule is the same whether the subscription is
// paid at creation or marked paid later — so both create and markPaid call this rather than
// restating it. They diverged once already: markPaid was missing the already-paused guard below.
export const applyRenewalPauseState = async (
  client: PausableClient | null,
  renewalType: RenewalType,
  startDate: string | null,
  transaction?: Transaction,
) => {
  if (!client) return;
  const options = transaction ? [{ transaction }] : [];

  if (renewalType === 'reactivation') {
    await client.update({ pausedSince: null }, ...options);
  } else if (renewalType === 'renewal' && !startDate && !client.pausedSince) {
    // sin fecha renewal: pause the client until a start date is manually assigned.
    // Skipped when already paused: resume counts the days still owed from pausedSince, so
    // restamping it to today would silently shorten a mid-plan pause.
    await client.update({ pausedSince: appToday() }, ...options);
  }
};

const eventTypeByRenewal = {
  reactivation: 'reactivated',
  renewal: 'plan_renewed',
} as const;

export const historyEventTypeFor = (renewalType: RenewalType) =>
  renewalType ? eventTypeByRenewal[renewalType] : ('plan_assigned' as const);

// A client may hold at most one upcoming subscription: one not yet started (a renewal registered
// ahead of time) or one still waiting for a start date (a "sin fecha" renewal).
export const findUpcomingSubscription = async (
  clientId: number,
  today: string,
): Promise<Subscription | null> =>
  Subscription.findOne({
    where: {
      clientId,
      finalizedAt: null,
      [Op.or]: [{ startDate: null }, { startDate: { [Op.gt]: today } }],
    },
  });
