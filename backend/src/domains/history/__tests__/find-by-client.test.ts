import Client from '../../../models/Client';
import ClientHistory from '../../../models/ClientHistory';
import { findByClient } from '../find-by-client';

jest.mock('../../../models/Client');
jest.mock('../../../models/ClientHistory');

describe('findByClient', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns history ordered by occurredAt descending when the client exists', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
    (ClientHistory.findAll as jest.Mock).mockResolvedValue([{ id: 1, eventType: 'paused' }]);

    const result = await findByClient(1);

    expect(ClientHistory.findAll).toHaveBeenCalledWith({
      where: { clientId: 1 },
      order: [['occurredAt', 'DESC']],
    });
    expect(result).toEqual([{ id: 1, eventType: 'paused' }]);
  });

  it('returns null without querying history when the client does not exist', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await findByClient(999);

    expect(result).toBeNull();
    expect(ClientHistory.findAll).not.toHaveBeenCalled();
  });
});
