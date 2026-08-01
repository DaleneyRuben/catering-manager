import Client from '../../../models/Client';
import { record } from '../../client-history';
import { extendAfterPause } from '../../subscription';
import { update } from '../update';

jest.mock('../../../models/Client');
jest.mock('../../client-history');
jest.mock('../../subscription');
jest.mock('../../../models/Subscription');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));

const mockClient = { id: 1, name: 'John Doe', pausedSince: null };
const actor = { userId: 9, username: 'ada' };

describe('update', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records paused history event when pausing', async () => {
    const pausedSince = '2026-06-10T12:00:00Z';
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, { pausedSince }, actor);

    expect(record).toHaveBeenCalledWith(actor, { type: 'paused', clientId: 1 });
  });

  it('records resumed history event when resuming', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-01'),
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, { pausedSince: null }, actor);

    expect(record).toHaveBeenCalledWith(actor, { type: 'resumed', clientId: 1 });
  });

  it('records the acting user on the history event', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: '2026-06-10T12:00:00Z' }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, { pausedSince: '2026-06-10T12:00:00Z' }, actor);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
      expect.anything(),
    );
  });

  it('extends the subscription when resuming', async () => {
    const pausedSince = new Date('2026-06-03T15:00:00Z');
    const mockSub = {
      id: 5,
      startDate: '2026-06-01',
      duration: 10,
      contractEndDate: '2026-06-12',
    };
    const mockInstance = {
      id: 1,
      pausedSince,
      subscriptions: [mockSub],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, { pausedSince: null }, actor);

    expect(extendAfterPause).toHaveBeenCalledWith(5, pausedSince);
  });

  it('extends the paid subscription, not a newer pending unpaid renewal, when resuming', async () => {
    const paidSub = {
      id: 60,
      paid: true,
      startDate: '2026-06-01',
      duration: 10,
      contractEndDate: '2026-06-12',
    };
    const unpaidSub = {
      id: 66,
      paid: false,
      startDate: null,
      duration: 20,
      contractEndDate: null,
    };
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-03T15:00:00Z'),
      subscriptions: [unpaidSub, paidSub],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, { pausedSince: null }, actor);

    expect(extendAfterPause).toHaveBeenCalledWith(60, expect.any(Date));
    expect(extendAfterPause).not.toHaveBeenCalledWith(66, expect.anything());
  });

  it('extends the subscription covering today, not a queued future renewal, when resuming', async () => {
    const futureSub = {
      id: 8,
      startDate: '2026-07-01',
      duration: 10,
      contractEndDate: '2026-07-15',
      finalizedAt: null,
    };
    const pausedSub = {
      id: 5,
      startDate: '2026-06-01',
      duration: 10,
      contractEndDate: '2026-06-12',
      finalizedAt: null,
    };
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-03T15:00:00Z'),
      subscriptions: [futureSub, pausedSub],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, { pausedSince: null }, actor);

    expect(extendAfterPause).toHaveBeenCalledWith(5, expect.any(Date));
    expect(extendAfterPause).not.toHaveBeenCalledWith(8, expect.anything());
  });

  it('does not record history when non-pause fields are updated', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, name: 'Jane Doe' }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await update(1, { name: 'Jane Doe' }, actor);

    expect(record).not.toHaveBeenCalled();
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await update(999, { pausedSince: null }, actor);

    expect(result).toBeNull();
  });
});
