import Subscription from '../../models/Subscription';
import Client from '../../models/Client';
import subscriptionService from '../subscription.service';

jest.mock('../../models/Subscription');
jest.mock('../../models/Client');

beforeEach(() => {
  jest.clearAllMocks();
});

const mockSubscription = {
  id: 1,
  clientId: 1,
  planId: 2,
  planPrice: 150.0,
  contractDate: '2026-05-01',
  startDate: '2026-05-01',
  contractEndDate: '2026-05-31',
};

const createData = {
  planId: 2,
  planPrice: 150.0,
  contractDate: '2026-05-01',
  startDate: '2026-05-01',
  contractEndDate: '2026-05-31',
};

describe('subscriptionService.create', () => {
  it('creates a subscription for an existing client', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    const result = await subscriptionService.create(1, createData);

    expect(Subscription.create).toHaveBeenCalledWith({ ...createData, clientId: 1 });
    expect(result).toMatchObject({ clientId: 1, planId: 2 });
  });

  it('returns null when client does not exist', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await subscriptionService.create(999, createData);

    expect(result).toBeNull();
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(subscriptionService.create(1, createData)).rejects.toThrow('db error');
  });
});

describe('subscriptionService.update', () => {
  it('updates a subscription and returns the updated instance', async () => {
    const updated = { ...mockSubscription, planPrice: 200.0 };
    const mockInstance = { update: jest.fn().mockResolvedValue(updated) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    const result = await subscriptionService.update(1, 1, { planPrice: 200.0 });

    expect(Subscription.findOne).toHaveBeenCalledWith({ where: { id: 1, clientId: 1 } });
    expect(mockInstance.update).toHaveBeenCalledWith({ planPrice: 200.0 });
    expect(result).toMatchObject({ planPrice: 200.0 });
  });

  it('returns null when subscription not found', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await subscriptionService.update(1, 999, { planPrice: 200.0 });

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    const mockInstance = { update: jest.fn().mockRejectedValue(new Error('db error')) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await expect(subscriptionService.update(1, 1, { planPrice: 200.0 })).rejects.toThrow(
      'db error',
    );
  });
});
