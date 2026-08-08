import { Op, Transaction } from 'sequelize';
import { HISTORY_EVENTS } from '../../constants/history.constants';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';

// Shared by findActiveSubscriptionsForDate and findSuspendedSubscriptionsForDate: subscriptions
// whose date range covers `date`, unpaused and not finalized. Suspension on `date` is not
// filtered here — callers split the result by suspendedDates themselves.
//
// The pause filter is on the subscription, not on the client join: a client may hold a paused
// "sin fecha" renewal alongside the plan they are still being delivered, and only the renewal is
// paused.
export const findContractActiveSubscriptions = async (date: string): Promise<Subscription[]> =>
  Subscription.findAll({
    where: {
      startDate: { [Op.lte]: date },
      contractEndDate: { [Op.gte]: date },
      finalizedAt: { [Op.is]: null },
      pausedSince: { [Op.is]: null },
      paid: true,
    },
    include: [{ model: Client }, { model: Plan }],
    order: [['createdAt', 'ASC']],
  });

type RenewalType = 'renewal' | 'reactivation' | null;

type PausableSubscription = {
  clientId: number;
  update: (data: object, options?: { transaction: Transaction }) => Promise<unknown>;
};

// A renewal decides the pause state of the plan it creates, and the rule is the same whether the
// subscription is paid at creation or marked paid later — so both create and markPaid call this
// rather than restating it.
export const applyRenewalPauseState = async (
  subscription: PausableSubscription | null,
  renewalType: RenewalType,
  startDate: string | null,
  transaction?: Transaction,
) => {
  if (!subscription) return;
  const options = transaction ? [{ transaction }] : [];

  if (renewalType === 'reactivation') {
    // Returning after a break clears whatever pause ended the client's previous plan. The row
    // being created here is already unpaused, so it needs no exclusion from the sweep.
    await Subscription.update(
      { pausedSince: null },
      {
        where: { clientId: subscription.clientId },
        ...(transaction ? { transaction } : {}),
      },
    );
  } else if (renewalType === 'renewal' && !startDate) {
    // sin fecha renewal: this plan waits, paused, until a start date is assigned. No guard for an
    // already-paused client is needed — a brand-new row cannot collide with a mid-plan pause held
    // on a different one.
    await subscription.update({ pausedSince: appToday() }, ...options);
  }
};

const eventTypeByRenewal = {
  reactivation: HISTORY_EVENTS.PLAN_REACTIVATED,
  renewal: HISTORY_EVENTS.PLAN_RENEWED,
} as const;

export const historyEventTypeFor = (renewalType: RenewalType) =>
  renewalType ? eventTypeByRenewal[renewalType] : HISTORY_EVENTS.PLAN_ASSIGNED;

// Special instructions are standing dietary preferences ("Ensalada grande", "DAR GRANDES"), not
// terms of one contract, so a renewal inherits them from the contract it follows. Without this the
// kitchen silently stops preparing them the day a client renews, with nothing on screen saying so.
export const findInheritedInstructions = async (
  clientId: number,
  transaction?: Transaction,
): Promise<Record<string, string> | null> => {
  const previous = await Subscription.findOne({
    where: { clientId },
    order: [['createdAt', 'DESC']],
    ...(transaction ? { transaction } : {}),
  });

  const instructions = previous?.specialInstructions;
  return instructions && Object.keys(instructions).length > 0 ? instructions : null;
};

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
