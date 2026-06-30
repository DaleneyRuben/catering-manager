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

    await update(1, { pausedSince });

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

    await update(1, { pausedSince: null });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'resumed' }),
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

    await update(1, { pausedSince: null });

    expect(mockSub.update).toHaveBeenCalledWith({ contractEndDate: '2026-06-17' });
  });

  it('does not record history when non-pause fields are updated', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, name: 'Jane Doe' }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await update(1, { name: 'Jane Doe' });

    expect(ClientHistory.create).not.toHaveBeenCalled();
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await update(999, { pausedSince: null });

    expect(result).toBeNull();
  });
});
