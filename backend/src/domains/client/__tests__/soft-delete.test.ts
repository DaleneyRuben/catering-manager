import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import { softDelete } from '../soft-delete';

jest.mock('../../../models/Client');
jest.mock('../../../models/ClientHistory');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const actor = { userId: 9, username: 'ada' };

describe('softDelete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls destroy on the client and records deleted history event', async () => {
    const mockInstance = {
      id: 1,
      destroy: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await softDelete(1, actor);

    expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'deleted' }),
    );
  });

  it('records the acting user on the history event', async () => {
    const mockInstance = {
      id: 1,
      destroy: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await softDelete(1, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
    );
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await softDelete(999, actor);

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(softDelete(1, actor)).rejects.toThrow('db error');
  });
});
