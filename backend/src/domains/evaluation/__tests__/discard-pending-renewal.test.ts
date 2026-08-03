import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import sequelize from '../../../database/sequelize';
import { remove } from '../../subscription';
import { discardPendingRenewal } from '../discard-pending-renewal';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');
jest.mock('../../subscription');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));

const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

describe('discardPendingRenewal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
  });

  it('permanently deletes the pending subscription and its linked appointment', async () => {
    const subscription = { id: 5 };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.destroy as jest.Mock).mockResolvedValue(1);

    const result = await discardPendingRenewal(1);

    expect(Appointment.destroy).toHaveBeenCalledWith({
      where: { subscriptionId: 5 },
      transaction,
    });
    expect(remove).toHaveBeenCalledWith(5, transaction);
    expect(result).toBe(subscription);
  });

  it('returns null when the client has no pending subscription', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await discardPendingRenewal(1);

    expect(Appointment.destroy).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('still deletes the subscription when no appointment references it', async () => {
    const subscription = { id: 5 };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.destroy as jest.Mock).mockResolvedValue(0);

    const result = await discardPendingRenewal(1);

    expect(remove).toHaveBeenCalledWith(5, transaction);
    expect(result).toBe(subscription);
  });

  // This read picks the row both deletes below act on. Outside the transaction it would not see
  // an unpaid subscription the same workflow just wrote, and would discard nothing.
  it('picks the pending subscription inside the transaction that deletes it', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue({ id: 5 });

    await discardPendingRenewal(1);

    expect(Subscription.findOne).toHaveBeenCalledWith({
      where: { clientId: 1, paid: false },
      order: [['id', 'ASC']],
      transaction,
    });
  });

  it('deletes the appointment and the subscription in one transaction', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue({ id: 5 });

    await discardPendingRenewal(1);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue({ id: 5 });

    await discardPendingRenewal(1, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(Appointment.destroy).toHaveBeenCalledWith({
      where: { subscriptionId: 5 },
      transaction: callerTransaction,
    });
    expect(remove).toHaveBeenCalledWith(5, callerTransaction);
  });

  it('leaves the subscription in place when the appointment cannot be deleted', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue({ id: 5 });
    (Appointment.destroy as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(discardPendingRenewal(1)).rejects.toThrow('db error');
    expect(remove).not.toHaveBeenCalled();
  });
});
