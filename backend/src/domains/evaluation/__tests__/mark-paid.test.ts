import { Op } from 'sequelize';
import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import { markPaid } from '../mark-paid';
import { appToday, subtractDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/Client');
jest.mock('../../../models/Plan');
jest.mock('../../../models/ClientHistory');

const actor = { userId: 9, username: 'ada' };

describe('markPaid', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns null when the client has no unpaid subscription', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await markPaid(1, actor);

    expect(result).toBeNull();
    expect(ClientHistory.create).not.toHaveBeenCalled();
  });

  it('marks the subscription paid and logs a plan_assigned history event', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    const result = await markPaid(1, actor);

    expect(Subscription.findOne).toHaveBeenCalledWith({
      where: { clientId: 1, paid: false },
      order: [['id', 'ASC']],
    });
    expect(subscription.update).toHaveBeenCalledWith({ paid: true });
    expect(ClientHistory.create).toHaveBeenCalledWith({
      clientId: 1,
      eventType: 'plan_assigned',
      occurredAt: expect.any(Date),
      metadata: {
        planId: 2,
        planName: 'Completo',
        planPrice: 5000,
        startDate: '2026-07-27',
        duration: 20,
        contractEndDate: '2026-08-21',
        discount: 500,
      },
      userId: 9,
      username: 'ada',
    });
    expect(result).toBe(subscription);
  });

  it('logs a plan_renewed history event when the subscription renewalType is renewal', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      renewalType: 'renewal',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'plan_renewed' }),
    );
  });

  it('logs a reactivated history event when the subscription renewalType is reactivation', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      renewalType: 'reactivation',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'reactivated' }),
    );
  });

  it('includes the appointmentId in the history metadata when persisted on the subscription', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      appointmentId: 4,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ appointmentId: 4 }) }),
    );
  });

  it('does not include appointmentId in the history metadata when not persisted on the subscription', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      appointmentId: null,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    const call = (ClientHistory.create as jest.Mock).mock.calls[0][0];
    expect(call.metadata).not.toHaveProperty('appointmentId');
  });

  it('finalizes overlapping prior subscriptions when confirming payment for a dated renewal', async () => {
    const oldSub = { id: 7, update: jest.fn().mockResolvedValue({}) };
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      renewalType: 'renewal',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Subscription.findAll as jest.Mock).mockResolvedValue([oldSub]);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(Subscription.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: 1,
          id: { [Op.ne]: 3 },
        }),
      }),
    );
    expect(oldSub.update).toHaveBeenCalledWith({
      contractEndDate: subtractDeliveryDays('2026-07-27', 1),
      finalizedAt: appToday(),
    });
  });

  it('does not look for overlaps when confirming payment for a sin-fecha renewal', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: null,
      duration: 20,
      contractEndDate: null,
      discount: 500,
      renewalType: 'renewal',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Client.findByPk as jest.Mock).mockResolvedValue({ update: jest.fn().mockResolvedValue({}) });
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(Subscription.findAll).not.toHaveBeenCalled();
  });

  it('sets pausedSince to today when confirming payment for a sin-fecha renewal', async () => {
    const mockClient = { update: jest.fn().mockResolvedValue({}) };
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: null,
      duration: 20,
      contractEndDate: null,
      discount: 500,
      renewalType: 'renewal',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(Client.findByPk).toHaveBeenCalledWith(1);
    expect(mockClient.update).toHaveBeenCalledWith({ pausedSince: appToday() });
  });

  it('clears pausedSince when confirming payment for a reactivation', async () => {
    const mockClient = { update: jest.fn().mockResolvedValue({}) };
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      renewalType: 'reactivation',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(mockClient.update).toHaveBeenCalledWith({ pausedSince: null });
  });

  it('does not touch pausedSince when confirming payment for a plain plan_assigned subscription', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      renewalType: null,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(Client.findByPk).not.toHaveBeenCalled();
  });
});
