import type { Transaction } from 'sequelize';
import Payment from '../../../models/Payment';
import type { Actor } from '../../../types/actor';
import { recordPayment } from '../record-payment';

jest.mock('../../../models/Payment');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => '2026-08-06',
}));

const mockedCreate = Payment.create as jest.Mock;

const actor: Actor = { userId: 7, username: 'Silvia' };

describe('recordPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreate.mockResolvedValue({});
  });

  it('stores the amount, client and subscription the money came from', async () => {
    await recordPayment({ clientId: 42, subscriptionId: 9, amount: 1350 }, actor);

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 42, subscriptionId: 9, amount: 1350 }),
      expect.anything(),
    );
  });

  it('dates the payment the day the money moved, not the period it covers', async () => {
    await recordPayment({ clientId: 42, subscriptionId: 9, amount: 1350 }, actor);

    expect(mockedCreate.mock.calls[0][0].paidAt).toBe('2026-08-06');
  });

  it('stamps the acting user as the one who registered it', async () => {
    await recordPayment({ clientId: 42, subscriptionId: 9, amount: 1350 }, actor);

    expect(mockedCreate.mock.calls[0][0].registeredBy).toBe(7);
  });

  it('joins the caller transaction when one is given', async () => {
    const transaction = {} as Transaction;

    await recordPayment({ clientId: 42, subscriptionId: 9, amount: 1350 }, actor, transaction);

    expect(mockedCreate).toHaveBeenCalledWith(expect.any(Object), { transaction });
  });

  it('propagates a write failure so the caller transaction rolls back', async () => {
    mockedCreate.mockRejectedValue(new Error('db down'));

    await expect(
      recordPayment({ clientId: 42, subscriptionId: 9, amount: 1350 }, actor),
    ).rejects.toThrow('db down');
  });
});
