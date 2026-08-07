import type { Transaction } from 'sequelize';
import Payment from '../../models/Payment';
import type { Actor } from '../../types/actor';
import { appToday } from '../../utils/date';

type PaymentData = {
  clientId: number;
  subscriptionId: number;
  amount: number;
};

// The only way a payment is created. Called by subscription/create.ts and subscription/mark-paid.ts
// inside their transaction — there is no endpoint that creates one directly (ADR-008).
export const recordPayment = async (
  data: PaymentData,
  actor: Actor,
  transaction?: Transaction,
): Promise<void> => {
  await Payment.create(
    {
      clientId: data.clientId,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      // Cash basis: dated the day the money moved, never the period it covers.
      paidAt: appToday(),
      registeredBy: actor.userId,
    },
    { transaction },
  );
};
