import Appointment from '../../../models/Appointment';
import Client from '../../../models/Client';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import { findPendingPayment } from '../find-pending-payment';

jest.mock('../../../models/Client');
jest.mock('../../../models/Appointment');

const clientFixture = (id: number, subscriptionId: number) => ({
  toJSON: () => ({ id, subscriptions: [{ id: subscriptionId }] }),
});

describe('findPendingPayment', () => {
  beforeEach(() => jest.resetAllMocks());

  it('queries clients with an unpaid subscription, newest first', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);
    (Appointment.findAll as jest.Mock).mockResolvedValue([]);

    await findPendingPayment();

    expect(Client.findAll).toHaveBeenCalledWith({
      include: [{ model: Subscription, include: [Plan], required: true, where: { paid: false } }],
      order: [['createdAt', 'DESC']],
    });
  });

  it('flags a pending client as an existing-client renewal when its appointment has a clientId', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([clientFixture(1, 10)]);
    (Appointment.findAll as jest.Mock).mockResolvedValue([{ subscriptionId: 10, clientId: 1 }]);

    const result = await findPendingPayment();

    expect(Appointment.findAll).toHaveBeenCalledWith({ where: { subscriptionId: [10] } });
    expect(result[0]).toMatchObject({ isExistingClientRenewal: true });
  });

  it('does not flag a pending client as an existing-client renewal for a new-client conversion', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([clientFixture(2, 20)]);
    (Appointment.findAll as jest.Mock).mockResolvedValue([{ subscriptionId: 20, clientId: null }]);

    const result = await findPendingPayment();

    expect(result[0]).toMatchObject({ isExistingClientRenewal: false });
  });

  it('skips the appointment lookup when there are no pending clients', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    await findPendingPayment();

    expect(Appointment.findAll).not.toHaveBeenCalled();
  });
});
