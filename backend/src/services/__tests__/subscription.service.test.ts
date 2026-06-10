import { format } from 'date-fns';
import Subscription from '../../models/Subscription';
import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import subscriptionService from '../subscription.service';
import { addDeliveryDays } from '../../utils/date';

jest.mock('../../models/Subscription');
jest.mock('../../models/Client');
jest.mock('../../models/ClientHistory');

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

  it('logs plan_assigned history event when renewalType is renewal', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      renewalType: 'renewal',
    });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'plan_assigned' }),
    );
  });

  it('logs reactivated history event when renewalType is reactivation', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
      renewalType: 'reactivation',
    });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'reactivated' }),
    );
  });

  it('does not log history when renewalType is not provided', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

    await subscriptionService.create(1, {
      planId: 2,
      startDate,
      contractDate: today,
      duration: 20,
    });

    expect(ClientHistory.create).not.toHaveBeenCalled();
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

describe('subscriptionService.update contract dates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('recalculates contractEndDate when startDate changes using existing duration', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { startDate: '2026-06-01' });

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: addDeliveryDays('2026-06-01', 19) }),
    );
  });

  it('recalculates contractEndDate when duration changes using existing startDate', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { duration: 30 });

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: addDeliveryDays('2026-05-26', 29) }),
    );
  });

  it('removes suspended dates that fall before the new startDate', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: ['2026-05-27', '2026-06-10'],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { startDate: '2026-06-01' });

    const call = mockInstance.update.mock.calls[0][0];
    expect(call.suspendedDates).not.toContain('2026-05-27');
    expect(call.suspendedDates).toContain('2026-06-10');
  });

  it('records plan_assigned history event when contract dates are updated', async () => {
    const mockInstance = {
      id: 1,
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await subscriptionService.update(1, 1, { startDate: '2026-06-01' });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'plan_assigned' }),
    );
  });

  it('does not recalculate contractEndDate when only contractDate changes', async () => {
    const originalEnd = addDeliveryDays('2026-05-26', 19);
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: originalEnd,
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { contractDate: '2026-05-20' });

    const call = mockInstance.update.mock.calls[0][0];
    expect(call.contractEndDate).toBeUndefined();
  });
});

describe('subscriptionService.update with suspendedDates', () => {
  const baseEnd = '2026-06-22'; // Monday

  beforeEach(() => jest.clearAllMocks());

  it('extends contractEndDate by 1 delivery day per newly added suspension', async () => {
    const mockInstance = {
      suspendedDates: [],
      contractEndDate: baseEnd,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { suspendedDates: ['2026-06-10'] });

    // Monday + 1 business day = Tuesday
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: addDeliveryDays(baseEnd, 1) }),
    );
  });

  it('skips weekend when extending contractEndDate across Friday', async () => {
    const friday = '2026-06-19'; // Friday
    const mockInstance = {
      suspendedDates: [],
      contractEndDate: friday,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { suspendedDates: ['2026-06-10'] });

    // Friday + 1 business day = Monday (skips Sat+Sun)
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: '2026-06-22' }),
    );
  });

  it('reduces contractEndDate by 1 delivery day per removed suspension', async () => {
    const mockInstance = {
      suspendedDates: ['2026-06-10'],
      contractEndDate: addDeliveryDays(baseEnd, 1), // Tuesday
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { suspendedDates: [] });

    // Tuesday - 1 business day = Monday
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: baseEnd }),
    );
  });

  it('skips weekend when reducing contractEndDate from Monday', async () => {
    const monday = '2026-06-22'; // Monday
    const mockInstance = {
      suspendedDates: ['2026-06-10'],
      contractEndDate: monday,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { suspendedDates: [] });

    // Monday - 1 business day = Friday (skips Sat+Sun)
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: '2026-06-19' }),
    );
  });

  it('records suspended history event when dates are added', async () => {
    const mockInstance = {
      id: 1,
      clientId: 1,
      suspendedDates: [],
      contractEndDate: baseEnd,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await subscriptionService.update(1, 1, { suspendedDates: ['2026-06-10'] });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'suspended' }),
    );
  });

  it('does not record history when only removing suspensions', async () => {
    const mockInstance = {
      id: 1,
      clientId: 1,
      suspendedDates: ['2026-06-10'],
      contractEndDate: addDeliveryDays(baseEnd, 1),
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await subscriptionService.update(1, 1, { suspendedDates: [] });

    expect(ClientHistory.create).not.toHaveBeenCalled();
  });
});
