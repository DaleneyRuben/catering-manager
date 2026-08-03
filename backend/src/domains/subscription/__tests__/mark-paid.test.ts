import { Op } from 'sequelize';
import { HISTORY_EVENTS } from '../../../constants/history.constants';
import Client from '../../../models/Client';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import sequelize from '../../../database/sequelize';
import { record } from '../../client-history';
import { markPaid } from '../mark-paid';
import { appToday, subtractDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/Client');
jest.mock('../../../models/Plan');
jest.mock('../../client-history');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn(), transaction: jest.fn() },
}));

const actor = { userId: 9, username: 'ada' };
const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

describe('markPaid', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
  });

  it('returns null when the client has no unpaid subscription', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await markPaid(1, actor);

    expect(result).toBeNull();
    expect(record).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
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
    expect(subscription.update).toHaveBeenCalledWith({ paid: true }, { transaction });
    expect(record).toHaveBeenCalledWith(
      actor,
      {
        type: HISTORY_EVENTS.PLAN_ASSIGNED,
        clientId: 1,
        metadata: {
          planId: 2,
          planName: 'Completo',
          planPrice: 5000,
          startDate: '2026-07-27',
          duration: 20,
          contractEndDate: '2026-08-21',
          discount: 500,
        },
      },
      transaction,
    );
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

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ type: HISTORY_EVENTS.PLAN_RENEWED }),
      transaction,
    );
  });

  it('logs a plan_reactivated history event when the subscription renewalType is reactivation', async () => {
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

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ type: HISTORY_EVENTS.PLAN_REACTIVATED }),
      transaction,
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

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ metadata: expect.objectContaining({ appointmentId: 4 }) }),
      transaction,
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

    const call = (record as jest.Mock).mock.calls[0][1];
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
        transaction,
      }),
    );
    expect(oldSub.update).toHaveBeenCalledWith(
      {
        contractEndDate: subtractDeliveryDays('2026-07-27', 1),
        finalizedAt: appToday(),
      },
      { transaction },
    );
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

  it('pauses the renewal itself when confirming payment for a sin-fecha renewal', async () => {
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

    expect(subscription.update).toHaveBeenCalledWith({ pausedSince: appToday() }, { transaction });
    expect(mockClient.update).not.toHaveBeenCalled();
  });

  // The old guard protected one shared column from being restamped. Each renewal now carries its
  // own pause, so deferring one behind a payment cannot disturb a pause held on another plan.
  it('pauses the renewal even when another plan of the same client is already paused', async () => {
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

    expect(subscription.update).toHaveBeenCalledWith({ pausedSince: appToday() }, { transaction });
  });

  it('clears the pause on the client other plans when confirming payment for a reactivation', async () => {
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

    expect(Subscription.update).toHaveBeenCalledWith(
      { pausedSince: null },
      expect.objectContaining({ where: { clientId: 1 }, transaction }),
    );
    expect(mockClient.update).not.toHaveBeenCalled();
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

  it('marks paid, finalizes overlaps and records history in one transaction', async () => {
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
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Client.findByPk as jest.Mock).mockResolvedValue({ update: jest.fn().mockResolvedValue({}) });
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
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
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await markPaid(1, actor, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(subscription.update).toHaveBeenCalledWith(
      { paid: true },
      { transaction: callerTransaction },
    );
    expect(record).toHaveBeenCalledWith(actor, expect.anything(), callerTransaction);
  });

  it('leaves the history event unwritten when the paid flag fails to persist', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      update: jest.fn().mockRejectedValue(new Error('db error')),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await expect(markPaid(1, actor)).rejects.toThrow('db error');
    expect(record).not.toHaveBeenCalled();
  });
});
