import type { Transaction } from 'sequelize';
import Payment from '../../models/Payment';

// Called only from subscription/update.ts when a subscription's agreed price is corrected. Within
// one subscription's life a price edit is always a correction — a renegotiation is the next
// renewal, and a plan change moves no money by rule — so the register follows it (ADR-008).
// Nothing on the Finanzas screen reaches this: a payment is never edited by hand.
export const adjustPayment = async (
  subscriptionId: number,
  amount: number,
  transaction?: Transaction,
): Promise<void> => {
  const payment = await Payment.findOne({ where: { subscriptionId }, transaction });
  if (!payment) return;

  await payment.update({ amount }, { transaction });
};
