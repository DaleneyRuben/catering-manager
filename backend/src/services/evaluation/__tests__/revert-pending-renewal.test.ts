import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import { revertPendingRenewal } from '../revert-pending-renewal';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');

describe('revertPendingRenewal', () => {
  beforeEach(() => jest.resetAllMocks());

  it('soft-deletes the pending subscription and resets the linked appointment to pending', async () => {
    const subscription = { id: 5, destroy: jest.fn().mockResolvedValue(undefined) };
    const appointment = { id: 9, subscriptionId: 5, update: jest.fn().mockResolvedValue({}) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.findOne as jest.Mock).mockResolvedValue(appointment);

    const result = await revertPendingRenewal(1);

    expect(Subscription.findOne).toHaveBeenCalledWith({ where: { clientId: 1, paid: false } });
    expect(Appointment.findOne).toHaveBeenCalledWith({ where: { subscriptionId: 5 } });
    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: null });
    expect(subscription.destroy).toHaveBeenCalled();
    expect(result).toBe(subscription);
  });

  it('returns null when the client has no pending subscription', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await revertPendingRenewal(1);

    expect(Appointment.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('soft-deletes the subscription even if no appointment references it', async () => {
    const subscription = { id: 5, destroy: jest.fn().mockResolvedValue(undefined) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.findOne as jest.Mock).mockResolvedValue(null);

    const result = await revertPendingRenewal(1);

    expect(subscription.destroy).toHaveBeenCalled();
    expect(result).toBe(subscription);
  });
});
