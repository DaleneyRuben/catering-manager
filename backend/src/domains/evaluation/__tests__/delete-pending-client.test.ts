import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import { softDelete } from '../../client';
import { remove } from '../../subscription';
import { deletePendingClient } from '../delete-pending-client';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');
jest.mock('../../client');
jest.mock('../../subscription');

const actor = { userId: 9, username: 'ada' };

describe('deletePendingClient', () => {
  beforeEach(() => jest.resetAllMocks());

  it('deletes appointments and permanently deletes the subscriptions, then soft-deletes the client', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([{ id: 3 }, { id: 4 }]);
    (Appointment.destroy as jest.Mock).mockResolvedValue(1);

    (softDelete as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await deletePendingClient(1, actor);

    expect(Subscription.findAll).toHaveBeenCalledWith({ where: { clientId: 1 } });
    expect(Appointment.destroy).toHaveBeenCalledWith({ where: { subscriptionId: [3, 4] } });
    expect(remove).toHaveBeenCalledWith([3, 4]);
    expect(softDelete).toHaveBeenCalledWith(1, actor);
    expect(result).toEqual({ id: 1 });
  });

  it('skips appointment and subscription cleanup when the client has no subscriptions', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (softDelete as jest.Mock).mockResolvedValue(null);

    const result = await deletePendingClient(99, actor);

    expect(Appointment.destroy).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(softDelete).toHaveBeenCalledWith(99, actor);
    expect(result).toBeNull();
  });
});
