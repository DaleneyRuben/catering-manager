import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import { finalize } from '../finalize';

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

    await finalize(1);

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

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await finalize(999);

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(finalize(1)).rejects.toThrow('db error');
  });
});
