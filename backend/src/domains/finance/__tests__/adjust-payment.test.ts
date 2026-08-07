import type { Transaction } from 'sequelize';
import Payment from '../../../models/Payment';
import { adjustPayment } from '../adjust-payment';

jest.mock('../../../models/Payment');

const mockedFindOne = Payment.findOne as jest.Mock;

describe('adjustPayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('moves the payment amount to the corrected price', async () => {
    const update = jest.fn().mockResolvedValue({});
    mockedFindOne.mockResolvedValue({ update });

    await adjustPayment(9, 1500);

    expect(update).toHaveBeenCalledWith({ amount: 1500 }, expect.anything());
  });

  it('does nothing when the subscription never produced a payment', async () => {
    mockedFindOne.mockResolvedValue(null);

    await expect(adjustPayment(9, 1500)).resolves.toBeUndefined();
  });

  it('joins the caller transaction when one is given', async () => {
    const update = jest.fn().mockResolvedValue({});
    mockedFindOne.mockResolvedValue({ update });
    const transaction = {} as Transaction;

    await adjustPayment(9, 1500, transaction);

    expect(mockedFindOne).toHaveBeenCalledWith(expect.objectContaining({ transaction }));
    expect(update).toHaveBeenCalledWith({ amount: 1500 }, { transaction });
  });

  it('looks the payment up by its subscription', async () => {
    mockedFindOne.mockResolvedValue(null);

    await adjustPayment(9, 1500);

    expect(mockedFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { subscriptionId: 9 } }),
    );
  });
});
