import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import { update } from '../update';

jest.mock('../../../models/Client');
jest.mock('../../../models/ClientHistory');
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
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await update(1, { pausedSince }, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'paused' }),
    );
  });

  it('records resumed history event when resuming', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-01'),
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await update(1, { pausedSince: null }, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'resumed' }),
    );
  });

  it('records the acting user on the history event', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: '2026-06-10T12:00:00Z' }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await update(1, { pausedSince: '2026-06-10T12:00:00Z' }, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
    );
  });

  it('extends contractEndDate on the subscription when resuming', async () => {
    const mockSub = {
      startDate: '2026-06-01',
      duration: 10,
      contractEndDate: '2026-06-12',
      update: jest.fn().mockResolvedValue({}),
    };
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-03T15:00:00Z'),
      subscriptions: [mockSub],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await update(1, { pausedSince: null }, actor);

    expect(mockSub.update).toHaveBeenCalledWith({ contractEndDate: '2026-06-17' });
  });

  it('extends the paid subscription, not a newer pending unpaid renewal, when resuming', async () => {
    const paidSub = {
      id: 60,
      paid: true,
      startDate: '2026-06-01',
      duration: 10,
      contractEndDate: '2026-06-12',
      update: jest.fn().mockResolvedValue({}),
    };
    const unpaidSub = {
      id: 66,
      paid: false,
      startDate: null,
      duration: 20,
      contractEndDate: null,
      update: jest.fn().mockResolvedValue({}),
    };
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-03T15:00:00Z'),
      subscriptions: [unpaidSub, paidSub],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await update(1, { pausedSince: null }, actor);

    expect(paidSub.update).toHaveBeenCalledWith({ contractEndDate: '2026-06-17' });
    expect(unpaidSub.update).not.toHaveBeenCalled();
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

    expect(ClientHistory.create).not.toHaveBeenCalled();
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await update(999, { pausedSince: null }, actor);

    expect(result).toBeNull();
  });
});
