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

describe('create', () => {
  it('creates a subscription and calculates contractEndDate', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    const result = await create(1, { planId: 2, startDate, contractDate: today, duration: 20 });

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ contractEndDate }));
    expect(result).toMatchObject({ clientId: 1, planId: 2 });
  });

  it('defaults discount to 0 when not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await create(1, { planId: 2, startDate, contractDate: today, duration: 20 });

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ discount: 0 }));
  });

  it('returns null when client does not exist', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await create(999, { planId: 2, startDate, contractDate: today, duration: 20 });

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

    await create(1, { planId: 2, contractDate: today, duration: 20 });

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: null, contractEndDate: null }),
    );
  });

  it('logs plan_renewed history event when renewalType is renewal', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      renewalType: 'renewal',
    });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'plan_renewed' }),
    );
  });

  it('clears pausedSince when renewalType is reactivation', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      renewalType: 'reactivation',
    });

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

    await create(1, { planId: 2, contractDate: today, duration: 20, renewalType: 'renewal' });

    expect(mockClient.update).toHaveBeenCalledWith({ pausedSince: today });
  });
});

describe('create with overlapping prior subscriptions', () => {
  it('finalizes prior non-finalized subscriptions overlapping the new startDate', async () => {
    const oldSub = { id: 7, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.findAll as jest.Mock).mockResolvedValue([oldSub]);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await create(1, {
      planId: 2,
      startDate: '2026-07-03',
      contractDate: today,
      duration: 20,
      renewalType: 'renewal',
    });

    expect(oldSub.update).toHaveBeenCalledWith({
      contractEndDate: subtractDeliveryDays('2026-07-03', 1),
      finalizedAt: today,
    });
  });

  it('queries only non-finalized subscriptions of the client ending on or after the new startDate', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await create(1, { planId: 2, startDate: '2026-07-03', contractDate: today, duration: 20 });

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

    await create(1, { planId: 2, contractDate: today, duration: 20, renewalType: 'renewal' });

    expect(Subscription.findAll).not.toHaveBeenCalled();
  });
});
