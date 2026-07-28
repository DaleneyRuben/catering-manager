import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import { finalize } from '../finalize';

const actor = { userId: 9, username: 'ada' };

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

describe('finalize', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets contractEndDate and finalizedAt to today and records finalized history event', async () => {
    const mockSub = { update: jest.fn().mockResolvedValue({}) };
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [mockSub],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await finalize(1, actor);

    expect(mockSub.update).toHaveBeenCalledWith(
      expect.objectContaining({
        contractEndDate: expect.any(String),
        finalizedAt: expect.any(String),
      }),
    );
    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'finalized' }),
    );
  });

  it('records the acting user on the history event', async () => {
    const mockSub = { update: jest.fn().mockResolvedValue({}) };
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [mockSub],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await finalize(1, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
    );
  });

  it('finalizes the subscription covering today, not a queued future renewal', async () => {
    const futureSub = {
      id: 8,
      startDate: '2026-07-01',
      contractEndDate: '2026-07-30',
      finalizedAt: null,
      update: jest.fn().mockResolvedValue({}),
    };
    const currentSub = {
      id: 5,
      startDate: '2026-05-01',
      contractEndDate: '2026-06-20',
      finalizedAt: null,
      update: jest.fn().mockResolvedValue({}),
    };
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [futureSub, currentSub],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await finalize(1, actor);

    expect(currentSub.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: '2026-06-05', finalizedAt: '2026-06-05' }),
    );
    expect(futureSub.update).not.toHaveBeenCalled();
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await finalize(999, actor);

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(finalize(1, actor)).rejects.toThrow('db error');
  });
});
