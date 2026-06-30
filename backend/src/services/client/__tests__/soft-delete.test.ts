import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import { softDelete } from '../soft-delete';

jest.mock('../../../models/Client');
jest.mock('../../../models/ClientHistory');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('softDelete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls destroy on the client and records deleted history event', async () => {
    const mockInstance = {
      id: 1,
      destroy: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await softDelete(1);

    expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'deleted' }),
    );
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await softDelete(999);

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(softDelete(1)).rejects.toThrow('db error');
  });
});
