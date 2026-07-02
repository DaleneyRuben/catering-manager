import Subscription from '../../../models/Subscription';
import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import { update } from '../update';
import { addDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/Client');
jest.mock('../../../models/ClientHistory');
jest.mock('../../../models/Plan');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('update', () => {
  it('updates a subscription and returns the updated instance', async () => {
    const updated = { id: 1, clientId: 1, contractEndDate: '2026-06-30' };
    const mockInstance = { update: jest.fn().mockResolvedValue(updated) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    const result = await update(1, 1, { contractEndDate: '2026-06-30' });

    expect(mockInstance.update).toHaveBeenCalledWith({ contractEndDate: '2026-06-30' });
    expect(result).toMatchObject({ contractEndDate: '2026-06-30' });
  });

  it('returns null when subscription not found', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await update(1, 999, { contractEndDate: '2026-06-30' });

    expect(result).toBeNull();
  });

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
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { startDate: '2026-06-01' });

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: addDeliveryDays('2026-06-01', 19) }),
    );
  });

  it('extends contractEndDate by 1 delivery day per newly added suspension', async () => {
    const baseEnd = '2026-06-22';
    const mockInstance = {
      suspendedDates: [],
      contractEndDate: baseEnd,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await update(1, 1, { suspendedDates: ['2026-06-10'] });

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: addDeliveryDays(baseEnd, 1) }),
    );
  });

  it('records suspended history event when dates are added', async () => {
    const mockInstance = {
      id: 1,
      clientId: 1,
      suspendedDates: [],
      contractEndDate: '2026-06-22',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await update(1, 1, { suspendedDates: ['2026-06-10'] });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'suspended' }),
    );
  });

  it('extends contractEndDate by surviving suspended dates when duration changes', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-06-04',
      duration: 20,
      contractEndDate: addDeliveryDays(addDeliveryDays('2026-06-04', 19), 2), // base + 2 suspensions
      suspendedDates: ['2026-06-10', '2026-06-11'],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { duration: 15 });

    // base end = 2026-06-04 + 14 delivery days; then +2 for the surviving suspensions
    const baseEnd = addDeliveryDays('2026-06-04', 14);
    const expectedEnd = addDeliveryDays(baseEnd, 2);
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: expectedEnd }),
    );
  });

  it('extends contractEndDate by surviving suspended dates when startDate changes', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays(addDeliveryDays('2026-05-26', 19), 3),
      suspendedDates: ['2026-05-27', '2026-06-10', '2026-06-11'], // 2026-05-27 will be removed
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { startDate: '2026-06-01' });

    // surviving suspensions: ['2026-06-10', '2026-06-11'] (2026-05-27 < new startDate)
    const baseEnd = addDeliveryDays('2026-06-01', 19);
    const expectedEnd = addDeliveryDays(baseEnd, 2);
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: expectedEnd }),
    );
  });
});
