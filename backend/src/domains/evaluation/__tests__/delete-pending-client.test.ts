import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import sequelize from '../../../database/sequelize';
import { softDelete } from '../../client';
import { remove } from '../../subscription';
import { deletePendingClient } from '../delete-pending-client';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');
jest.mock('../../client');
jest.mock('../../subscription');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));

const actor = { userId: 9, username: 'ada' };
const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

describe('deletePendingClient', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
  });

  it('deletes appointments and permanently deletes the subscriptions, then soft-deletes the client', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([{ id: 3 }, { id: 4 }]);
    (Appointment.destroy as jest.Mock).mockResolvedValue(1);

    (softDelete as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await deletePendingClient(1, actor);

    expect(Appointment.destroy).toHaveBeenCalledWith({
      where: { subscriptionId: [3, 4] },
      transaction,
    });
    expect(remove).toHaveBeenCalledWith([3, 4], transaction);
    expect(softDelete).toHaveBeenCalledWith(1, actor, transaction);
    expect(result).toEqual({ id: 1 });
  });

  it('skips appointment and subscription cleanup when the client has no subscriptions', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (softDelete as jest.Mock).mockResolvedValue(null);

    const result = await deletePendingClient(99, actor);

    expect(Appointment.destroy).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(softDelete).toHaveBeenCalledWith(99, actor, transaction);
    expect(result).toBeNull();
  });

  // The ids this read gathers are exactly the rows destroyed below. Read outside the transaction
  // it would miss a subscription the same workflow just wrote, leaving it behind pointing at a
  // client that no longer exists.
  it('gathers the subscriptions inside the transaction that deletes them', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([{ id: 3 }]);
    (softDelete as jest.Mock).mockResolvedValue({ id: 1 });

    await deletePendingClient(1, actor);

    expect(Subscription.findAll).toHaveBeenCalledWith({ where: { clientId: 1 }, transaction });
  });

  it('deletes the appointments, the subscriptions and the client in one transaction', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([{ id: 3 }, { id: 4 }]);
    (softDelete as jest.Mock).mockResolvedValue({ id: 1 });

    await deletePendingClient(1, actor);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([{ id: 3 }]);
    (softDelete as jest.Mock).mockResolvedValue({ id: 1 });

    await deletePendingClient(1, actor, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(Appointment.destroy).toHaveBeenCalledWith({
      where: { subscriptionId: [3] },
      transaction: callerTransaction,
    });
    expect(remove).toHaveBeenCalledWith([3], callerTransaction);
    expect(softDelete).toHaveBeenCalledWith(1, actor, callerTransaction);
  });

  it('leaves the client in place when the subscriptions cannot be deleted', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([{ id: 3 }]);
    (Appointment.destroy as jest.Mock).mockResolvedValue(1);
    (remove as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(deletePendingClient(1, actor)).rejects.toThrow('db error');
    expect(softDelete).not.toHaveBeenCalled();
  });
});
