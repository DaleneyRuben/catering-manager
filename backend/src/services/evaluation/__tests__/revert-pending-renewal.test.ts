import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import { revertPendingRenewal } from '../revert-pending-renewal';
import { appToday } from '../../../utils/date';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');

describe('revertPendingRenewal', () => {
  beforeEach(() => jest.resetAllMocks());

  it('permanently deletes the pending subscription and resets the linked appointment to pending', async () => {
    const subscription = { id: 5, destroy: jest.fn().mockResolvedValue(undefined) };
    const appointment = { id: 9, subscriptionId: 5, update: jest.fn().mockResolvedValue({}) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.findOne as jest.Mock).mockResolvedValue(appointment);

    const result = await revertPendingRenewal(1);

    expect(Subscription.findOne).toHaveBeenCalledWith({
      where: { clientId: 1, paid: false },
      order: [['id', 'ASC']],
    });
    expect(Appointment.findOne).toHaveBeenCalledWith({ where: { subscriptionId: 5 } });
    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: null });
    expect(subscription.destroy).toHaveBeenCalledWith({ force: true });
    expect(result).toBe(subscription);
  });

  it('bumps the appointment date to today when it has already passed', async () => {
    const subscription = { id: 5, destroy: jest.fn().mockResolvedValue(undefined) };
    const appointment = {
      id: 9,
      subscriptionId: 5,
      date: '2020-01-01',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.findOne as jest.Mock).mockResolvedValue(appointment);

    await revertPendingRenewal(1);

    expect(appointment.update).toHaveBeenCalledWith({
      subscriptionId: null,
      date: appToday(),
    });
  });

  it('leaves a current or future appointment date unchanged when reverting', async () => {
    const subscription = { id: 5, destroy: jest.fn().mockResolvedValue(undefined) };
    const appointment = {
      id: 9,
      subscriptionId: 5,
      date: '2099-01-01',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.findOne as jest.Mock).mockResolvedValue(appointment);

    await revertPendingRenewal(1);

    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: null });
  });

  it('returns null when the client has no pending subscription', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await revertPendingRenewal(1);

    expect(Appointment.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('permanently deletes the subscription even if no appointment references it', async () => {
    const subscription = { id: 5, destroy: jest.fn().mockResolvedValue(undefined) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Appointment.findOne as jest.Mock).mockResolvedValue(null);

    const result = await revertPendingRenewal(1);

    expect(subscription.destroy).toHaveBeenCalledWith({ force: true });
    expect(result).toBe(subscription);
  });
});
