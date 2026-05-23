import { format } from 'date-fns';
import Subscription from '../../models/Subscription';
import Client from '../../models/Client';
import subscriptionService from '../subscription.service';
import { addDeliveryDays } from '../../utils/date';

jest.mock('../../models/Subscription');
jest.mock('../../models/Client');

beforeEach(() => {
  jest.clearAllMocks();
});

const today = format(new Date(), 'yyyy-MM-dd');
const startDate = '2026-05-26';
const contractEndDate = addDeliveryDays(startDate, 20);

const mockSubscription = {
  id: 1,
  clientId: 1,
  planId: 2,
  contractDate: today,
  startDate,
  contractEndDate,
};

describe('subscriptionService.create', () => {
  it('creates a subscription when dates match calculated values', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    const result = await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      contractEndDate,
    });

    expect(Subscription.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ clientId: 1, planId: 2 });
  });

  it('throws 400 when contractDate does not match today', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });

    await expect(
      subscriptionService.create(1, {
        planId: 2,
        startDate,
        contractDate: '2026-01-01',
        contractEndDate,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('throws 400 when contractEndDate does not match calculated value', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });

    await expect(
      subscriptionService.create(1, {
        planId: 2,
        startDate,
        contractDate: today,
        contractEndDate: '2026-12-31',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('returns null when client does not exist', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await subscriptionService.create(999, {
      planId: 2,
      startDate,
      contractDate: today,
      contractEndDate,
    });

    expect(result).toBeNull();
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(
      subscriptionService.create(1, { planId: 2, startDate, contractDate: today, contractEndDate }),
    ).rejects.toThrow('db error');
  });
});

describe('subscriptionService.update', () => {
  it('updates a subscription and returns the updated instance', async () => {
    const updated = { ...mockSubscription, contractEndDate: '2026-06-30' };
    const mockInstance = { update: jest.fn().mockResolvedValue(updated) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    const result = await subscriptionService.update(1, 1, { contractEndDate: '2026-06-30' });

    expect(Subscription.findOne).toHaveBeenCalledWith({ where: { id: 1, clientId: 1 } });
    expect(mockInstance.update).toHaveBeenCalledWith({ contractEndDate: '2026-06-30' });
    expect(result).toMatchObject({ contractEndDate: '2026-06-30' });
  });

  it('returns null when subscription not found', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await subscriptionService.update(1, 999, { contractEndDate: '2026-06-30' });

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    const mockInstance = { update: jest.fn().mockRejectedValue(new Error('db error')) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await expect(
      subscriptionService.update(1, 1, { contractEndDate: '2026-06-30' }),
    ).rejects.toThrow('db error');
  });
});
