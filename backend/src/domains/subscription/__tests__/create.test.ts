import { Op } from 'sequelize';
import Subscription from '../../../models/Subscription';
import Client from '../../../models/Client';
import Plan from '../../../models/Plan';
import { record } from '../../client-history';
import { create } from '../create';
import { addDeliveryDays, appToday, subtractDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/Client');
jest.mock('../../client-history');
jest.mock('../../../models/Plan');

beforeEach(() => {
  jest.clearAllMocks();
});

const today = appToday();
const startDate = '2026-05-26';
const contractEndDate = addDeliveryDays(startDate, 19);

const mockSubscription = {
  id: 1,
  clientId: 1,
  planId: 2,
  discount: 0,
  contractDate: today,
  startDate,
  contractEndDate,
};

const actor = { userId: 9, username: 'ada' };

describe('create', () => {
  it('creates a subscription and calculates contractEndDate', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    const result = await create(
      1,
      { planId: 2, startDate, contractDate: today, duration: 20 },
      actor,
    );

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ contractEndDate }));
    expect(result).toMatchObject({ clientId: 1, planId: 2 });
  });

  it('defaults discount to 0 when not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ discount: 0 }));
  });

  it('defaults paid to true when not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ paid: true }));
  });

  it('passes paid false through when creating an unpaid subscription', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue({ ...mockSubscription, paid: false });

    await create(
      1,
      { planId: 2, startDate, contractDate: today, duration: 20, paid: false },
      actor,
    );

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ paid: false }));
  });

  it('returns null when client does not exist', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await create(
      999,
      { planId: 2, startDate, contractDate: today, duration: 20 },
      actor,
    );

    expect(result).toBeNull();
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('creates subscription with null startDate when startDate is omitted', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue({
      ...mockSubscription,
      startDate: null,
      contractEndDate: null,
    });

    await create(1, { planId: 2, contractDate: today, duration: 20 }, actor);

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: null, contractEndDate: null }),
    );
  });

  it('logs plan_assigned history event when creating a paid subscription with no renewalType', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ type: 'plan_assigned', clientId: 1 }),
      undefined,
    );
  });

  it('records the acting user on the history event', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
      expect.anything(),
      undefined,
    );
  });

  it('does not log a history event when creating an unpaid subscription with no renewalType', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue({ ...mockSubscription, paid: false });
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(
      1,
      { planId: 2, startDate, contractDate: today, duration: 20, paid: false },
      actor,
    );

    expect(record).not.toHaveBeenCalled();
  });

  it('logs plan_renewed history event when renewalType is renewal', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(
      1,
      {
        planId: 2,
        startDate,
        contractDate: today,
        duration: 20,
        renewalType: 'renewal',
      },
      actor,
    );

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ type: 'plan_renewed', clientId: 1 }),
      undefined,
    );
  });

  it('clears the pause on the client other subscriptions when renewalType is reactivation', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);

    await create(
      1,
      {
        planId: 2,
        startDate,
        contractDate: today,
        duration: 20,
        renewalType: 'reactivation',
      },
      actor,
    );

    expect(Subscription.update).toHaveBeenCalledWith(
      { pausedSince: null },
      expect.objectContaining({ where: expect.objectContaining({ clientId: 1 }) }),
    );
  });

  // The sin-fecha marker goes on the renewal itself. Stamping the client instead used to
  // suppress every plan they had, including one still running and still paid for.
  it('pauses the new subscription when renewalType is renewal with no startDate', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    const created = {
      ...mockSubscription,
      startDate: null,
      contractEndDate: null,
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue(created);
    (record as jest.Mock).mockResolvedValue(undefined);

    await create(
      1,
      { planId: 2, contractDate: today, duration: 20, renewalType: 'renewal' },
      actor,
    );

    expect(created.update).toHaveBeenCalledWith({ pausedSince: today });
    expect(mockClient.update).not.toHaveBeenCalled();
  });

  // The old guard existed because one column served every plan the client had; a brand-new
  // renewal row cannot collide with a mid-plan pause recorded on a different row.
  it('pauses the new renewal even when another subscription is already paused', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    const created = {
      ...mockSubscription,
      startDate: null,
      contractEndDate: null,
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue(created);
    (record as jest.Mock).mockResolvedValue(undefined);

    await create(
      1,
      { planId: 2, contractDate: today, duration: 20, renewalType: 'renewal' },
      actor,
    );

    expect(created.update).toHaveBeenCalledWith({ pausedSince: today });
  });

  it('persists renewalType on the subscription row when provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);

    await create(
      1,
      {
        planId: 2,
        startDate,
        contractDate: today,
        duration: 20,
        renewalType: 'reactivation',
      },
      actor,
    );

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ renewalType: 'reactivation' }),
    );
  });

  it('persists renewalType as null when not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ renewalType: null }),
    );
  });

  it('persists appointmentId on the subscription row when provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(
      1,
      { planId: 2, startDate, contractDate: today, duration: 20, appointmentId: 4 },
      actor,
    );

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ appointmentId: 4 }));
  });

  it('persists appointmentId as null when not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: null }),
    );
  });

  it('includes the appointmentId in the history metadata when provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(
      1,
      { planId: 2, startDate, contractDate: today, duration: 20, appointmentId: 4 },
      actor,
    );

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ metadata: expect.objectContaining({ appointmentId: 4 }) }),
      undefined,
    );
  });

  it('does not include appointmentId in the history metadata when not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    const call = (record as jest.Mock).mock.calls[0][1];
    expect(call.metadata).not.toHaveProperty('appointmentId');
  });

  it('does not log a history event when creating an unpaid renewal', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue({ ...mockSubscription, paid: false });
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(
      1,
      {
        planId: 2,
        startDate,
        contractDate: today,
        duration: 20,
        renewalType: 'renewal',
        paid: false,
      },
      actor,
    );

    expect(record).not.toHaveBeenCalled();
  });

  it('does not log a history event when creating an unpaid reactivation', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });
    (Subscription.create as jest.Mock).mockResolvedValue({ ...mockSubscription, paid: false });
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(
      1,
      {
        planId: 2,
        startDate,
        contractDate: today,
        duration: 20,
        renewalType: 'reactivation',
        paid: false,
      },
      actor,
    );

    expect(record).not.toHaveBeenCalled();
  });

  it('does not set pausedSince when creating an unpaid sin-fecha renewal', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue({
      ...mockSubscription,
      startDate: null,
      contractEndDate: null,
      paid: false,
    });

    await create(
      1,
      {
        planId: 2,
        contractDate: today,
        duration: 20,
        renewalType: 'renewal',
        paid: false,
      },
      actor,
    );

    expect(mockClient.update).not.toHaveBeenCalled();
  });

  it('does not clear pausedSince when creating an unpaid reactivation', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue({ ...mockSubscription, paid: false });

    await create(
      1,
      {
        planId: 2,
        startDate,
        contractDate: today,
        duration: 20,
        renewalType: 'reactivation',
        paid: false,
      },
      actor,
    );

    expect(mockClient.update).not.toHaveBeenCalled();
  });
});

describe('create with an upcoming subscription already registered', () => {
  it('rejects with a 409 conflict when the client already has a future subscription', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.findOne as jest.Mock).mockResolvedValue({ id: 5, startDate: '2026-08-03' });

    await expect(
      create(
        1,
        {
          planId: 2,
          startDate,
          contractDate: today,
          duration: 20,
          renewalType: 'renewal',
        },
        actor,
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('does not create a subscription when the client already has an upcoming one', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.findOne as jest.Mock).mockResolvedValue({ id: 5, startDate: null });

    await expect(
      create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor),
    ).rejects.toThrow();

    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('looks only for non-finalized subscriptions with no start date or a future one', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(Subscription.findOne).toHaveBeenCalledWith({
      where: {
        clientId: 1,
        finalizedAt: null,
        [Op.or]: [{ startDate: null }, { startDate: { [Op.gt]: today } }],
      },
    });
  });

  it('creates the subscription when no upcoming one exists', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    const result = await create(
      1,
      { planId: 2, startDate, contractDate: today, duration: 20 },
      actor,
    );

    expect(result).toMatchObject({ clientId: 1 });
  });
});

describe('create with overlapping prior subscriptions', () => {
  it('finalizes prior non-finalized subscriptions overlapping the new startDate', async () => {
    const oldSub = { id: 7, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.findAll as jest.Mock).mockResolvedValue([oldSub]);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await create(
      1,
      {
        planId: 2,
        startDate: '2026-07-03',
        contractDate: today,
        duration: 20,
        renewalType: 'renewal',
      },
      actor,
    );

    expect(oldSub.update).toHaveBeenCalledWith({
      contractEndDate: subtractDeliveryDays('2026-07-03', 1),
      finalizedAt: today,
    });
  });

  it('queries only non-finalized subscriptions of the client ending on or after the new startDate', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await create(
      1,
      { planId: 2, startDate: '2026-07-03', contractDate: today, duration: 20 },
      actor,
    );

    expect(Subscription.findAll).toHaveBeenCalledWith({
      where: expect.objectContaining({
        clientId: 1,
        finalizedAt: null,
        contractEndDate: { [Op.gte]: '2026-07-03' },
      }),
    });
  });

  it('does not look for overlaps when the new subscription has no startDate', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });
    (Subscription.create as jest.Mock).mockResolvedValue({
      ...mockSubscription,
      startDate: null,
      contractEndDate: null,
      update: jest.fn().mockResolvedValue({}),
    });

    await create(
      1,
      { planId: 2, contractDate: today, duration: 20, renewalType: 'renewal' },
      actor,
    );

    expect(Subscription.findAll).not.toHaveBeenCalled();
  });

  it('does not finalize prior subscriptions when creating an unpaid renewal', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue({ ...mockSubscription, paid: false });

    await create(
      1,
      {
        planId: 2,
        startDate: '2026-07-03',
        contractDate: today,
        duration: 20,
        renewalType: 'renewal',
        paid: false,
      },
      actor,
    );

    expect(Subscription.findAll).not.toHaveBeenCalled();
  });
});

describe('create with a transaction', () => {
  it('threads the transaction through every model call', async () => {
    const transaction = { id: 'txn-1' };
    const oldSub = { id: 7, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });
    (Subscription.findAll as jest.Mock).mockResolvedValue([oldSub]);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (record as jest.Mock).mockResolvedValue(undefined);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(
      1,
      {
        planId: 2,
        startDate: '2026-07-03',
        contractDate: today,
        duration: 20,
        renewalType: 'renewal',
      },
      actor,
      transaction as never,
    );

    expect(Client.findByPk).toHaveBeenCalledWith(1, { transaction });
    expect(Subscription.findAll).toHaveBeenCalledWith(expect.objectContaining({ transaction }));
    expect(oldSub.update).toHaveBeenCalledWith(expect.anything(), { transaction });
    expect(Subscription.create).toHaveBeenCalledWith(expect.anything(), { transaction });
    expect(Plan.findByPk).toHaveBeenCalledWith(2, { transaction });
    expect(record).toHaveBeenCalledWith(actor, expect.anything(), transaction);
  });
});
