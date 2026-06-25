import { format } from 'date-fns';
import Subscription from '../../models/Subscription';
import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import Plan from '../../models/Plan';
import subscriptionService from '../subscription.service';
import { addDeliveryDays } from '../../utils/date';

jest.mock('../../models/Subscription');
jest.mock('../../models/Client');
jest.mock('../../models/ClientHistory');
jest.mock('../../models/Plan');

beforeEach(() => {
  jest.clearAllMocks();
});

const today = format(new Date(), 'yyyy-MM-dd');
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

describe('subscriptionService.create', () => {
  it('creates a subscription and calculates contractEndDate', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    const result = await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
    });

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ contractEndDate }));
    expect(result).toMatchObject({ clientId: 1, planId: 2 });
  });

  it('defaults discount to 0 when not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
    });

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ discount: 0 }));
  });

  it('stores provided discount', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue({ ...mockSubscription, discount: 500 });

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      discount: 500,
    });

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ discount: 500 }));
  });

  it('accepts a past contractDate', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    const result = await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: '2026-01-01',
      duration: 20,
    });

    expect(Subscription.create).toHaveBeenCalled();
    expect(result).toMatchObject({ clientId: 1 });
  });

  it('returns null when client does not exist', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await subscriptionService.create(999, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
    });

    expect(result).toBeNull();
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(
      subscriptionService.create(1, { planId: 2, startDate, contractDate: today, duration: 20 }),
    ).rejects.toThrow('db error');
  });

  it('creates subscription with null startDate and contractEndDate when startDate is omitted', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue({
      ...mockSubscription,
      startDate: null,
      contractEndDate: null,
    });

    await subscriptionService.create(1, { planId: 2, contractDate: today, duration: 20 });

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: null, contractEndDate: null }),
    );
  });

  it('logs plan_renewed history event with plan details when renewalType is renewal', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      renewalType: 'renewal',
    });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 1,
        eventType: 'plan_renewed',
        metadata: expect.objectContaining({ planName: 'Completo', planPrice: 5000 }),
      }),
    );
  });

  it('logs reactivated history event with plan details when renewalType is reactivation', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      renewalType: 'reactivation',
    });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 1,
        eventType: 'reactivated',
        metadata: expect.objectContaining({ planName: 'Completo', planPrice: 5000 }),
      }),
    );
  });

  it('clears pausedSince when renewalType is reactivation', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      renewalType: 'reactivation',
    });

    expect(mockClient.update).toHaveBeenCalledWith({ pausedSince: null });
  });

  it('does not update pausedSince when renewalType is renewal with a startDate', async () => {
    const mockClient = { id: 1, update: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      renewalType: 'renewal',
    });

    expect(mockClient.update).not.toHaveBeenCalledWith({ pausedSince: null });
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

    await subscriptionService.create(1, {
      planId: 2,
      contractDate: today,
      duration: 20,
      renewalType: 'renewal',
    });

    expect(mockClient.update).toHaveBeenCalledWith({ pausedSince: today });
  });

  it('persists specialInstructions when provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      specialInstructions: { salad: 'DAR GRANDES' },
    });

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ specialInstructions: { salad: 'DAR GRANDES' } }),
    );
  });

  it('omits specialInstructions from create when not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
    });

    expect(Subscription.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ specialInstructions: expect.anything() }),
    );
  });

  it('logs plan_assigned history event when renewalType is not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
    });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'plan_assigned' }),
    );
  });
});
