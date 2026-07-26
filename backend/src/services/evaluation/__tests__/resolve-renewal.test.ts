import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import sequelize from '../../../database/sequelize';
import { create as createSubscription } from '../../subscription';
import { resolveRenewal } from '../resolve-renewal';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));
jest.mock('../../subscription');

const subscriptionData = {
  planId: 2,
  contractDate: '2026-07-24',
  duration: 20,
  startDate: null,
  renewalType: 'renewal',
  paid: false,
} as never;

const actor = { userId: 9, username: 'ada' };
const transaction = { id: 'txn-1' };

describe('resolveRenewal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((cb) => cb(transaction));
  });

  it('returns null when the appointment does not exist', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await resolveRenewal(99, subscriptionData, actor);

    expect(result).toBeNull();
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('returns null when the appointment has no linked client', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      clientId: null,
      subscriptionId: null,
    });

    const result = await resolveRenewal(1, subscriptionData, actor);

    expect(result).toBeNull();
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('returns null when the appointment is already resolved', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      clientId: 7,
      subscriptionId: 5,
    });

    const result = await resolveRenewal(1, subscriptionData, actor);

    expect(result).toBeNull();
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('returns an already_pending reason when the client already has an unpaid subscription', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      clientId: 7,
      subscriptionId: null,
    });
    (Subscription.findOne as jest.Mock).mockResolvedValue({ id: 11 });

    const result = await resolveRenewal(1, subscriptionData, actor);

    expect(Subscription.findOne).toHaveBeenCalledWith({ where: { clientId: 7, paid: false } });
    expect(result).toEqual({ subscription: null, reason: 'already_pending' });
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('creates the subscription and stamps the appointment inside a transaction', async () => {
    const appointment = {
      id: 1,
      clientId: 7,
      subscriptionId: null,
      update: jest.fn().mockResolvedValue({}),
    };
    (Appointment.findByPk as jest.Mock).mockResolvedValue(appointment);
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);
    (createSubscription as jest.Mock).mockResolvedValue({ id: 3, clientId: 7 });

    const result = await resolveRenewal(1, subscriptionData, actor);

    expect(sequelize.transaction).toHaveBeenCalled();
    expect(createSubscription).toHaveBeenCalledWith(
      7,
      { ...(subscriptionData as object), appointmentId: 1 },
      actor,
      transaction,
    );
    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: 3 }, { transaction });
    expect(result).toEqual({ subscription: { id: 3, clientId: 7 } });
  });

  it('does not stamp the appointment when subscription creation fails inside the transaction', async () => {
    const appointment = {
      id: 1,
      clientId: 7,
      subscriptionId: null,
      update: jest.fn().mockResolvedValue({}),
    };
    (Appointment.findByPk as jest.Mock).mockResolvedValue(appointment);
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);
    (createSubscription as jest.Mock).mockResolvedValue(null);

    const result = await resolveRenewal(1, subscriptionData, actor);

    expect(appointment.update).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
