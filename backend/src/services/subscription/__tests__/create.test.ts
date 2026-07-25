import { Op } from 'sequelize';
import Subscription from '../../../models/Subscription';
import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import Plan from '../../../models/Plan';
import { create } from '../create';
import { addDeliveryDays, appToday, subtractDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/Client');
jest.mock('../../../models/ClientHistory');
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
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'plan_assigned' }),
    );
  });

  it('records the acting user on the history event', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
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

    expect(ClientHistory.create).not.toHaveBeenCalled();
  });

  it('logs plan_renewed history event when renewalType is renewal', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
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

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'plan_renewed' }),
    );
  });

  it('clears pausedSince when renewalType is reactivation', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

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

    expect(mockClient.update).toHaveBeenCalledWith({ pausedSince: null });
  });

  it('sets pausedSince to today when renewalType is renewal with no startDate', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue({
      ...mockSubscription,
      startDate: null,
      contractEndDate: null,
    });
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await create(
      1,
      { planId: 2, contractDate: today, duration: 20, renewalType: 'renewal' },
      actor,
    );

    expect(mockClient.update).toHaveBeenCalledWith({ pausedSince: today });
  });

  it('persists renewalType on the subscription row when provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

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
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 }, actor);

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ renewalType: null }),
    );
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

    expect(ClientHistory.create).not.toHaveBeenCalled();
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

    expect(ClientHistory.create).not.toHaveBeenCalled();
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
    });

    await create(
      1,
      { planId: 2, contractDate: today, duration: 20, renewalType: 'renewal' },
      actor,
    );

    expect(Subscription.findAll).not.toHaveBeenCalled();
  });
});
