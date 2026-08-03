import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import { remove } from '../../subscription';
import { discardPendingRenewal } from '../discard-pending-renewal';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');
jest.mock('../../subscription');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));

describe('discardPendingRenewal', () => {
  beforeEach(() => jest.resetAllMocks());

  it('permanently deletes the pending subscription and its linked appointment', async () => {
    const subscription = { id: 5 };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.destroy as jest.Mock).mockResolvedValue(1);

    const result = await discardPendingRenewal(1);

    expect(Subscription.findOne).toHaveBeenCalledWith({
      where: { clientId: 1, paid: false },
      order: [['id', 'ASC']],
    });
    expect(Appointment.destroy).toHaveBeenCalledWith({ where: { subscriptionId: 5 } });
    expect(remove).toHaveBeenCalledWith(5);
    expect(result).toBe(subscription);
  });

  it('returns null when the client has no pending subscription', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await discardPendingRenewal(1);

    expect(Appointment.destroy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('still deletes the subscription when no appointment references it', async () => {
    const subscription = { id: 5 };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.destroy as jest.Mock).mockResolvedValue(0);

    const result = await discardPendingRenewal(1);

    expect(remove).toHaveBeenCalledWith(5);
    expect(result).toBe(subscription);
  });
});
