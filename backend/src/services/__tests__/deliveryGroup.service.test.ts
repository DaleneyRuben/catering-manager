import Client from '../../models/Client';
import deliveryGroupService from '../deliveryGroup.service';

jest.mock('../../models/Client');

const makeClient = (overrides: object = {}) => ({
  id: 1,
  name: 'Ana',
  groupToken: null,
  update: jest.fn(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('deliveryGroupService.link', () => {
  it('does nothing when both clients already share the same token', async () => {
    const token = 'same-token';
    (Client.findByPk as jest.Mock)
      .mockResolvedValueOnce(makeClient({ id: 1, groupToken: token }))
      .mockResolvedValueOnce(makeClient({ id: 2, groupToken: token }));

    await deliveryGroupService.link(1, 2);

    expect(Client.update).not.toHaveBeenCalled();
  });

  it('assigns client the target token when only target has a token', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: null });
    (Client.findByPk as jest.Mock)
      .mockResolvedValueOnce(clientInstance)
      .mockResolvedValueOnce(makeClient({ id: 2, groupToken: 'target-token' }));

    await deliveryGroupService.link(1, 2);

    expect(clientInstance.update).toHaveBeenCalledWith({ groupToken: 'target-token' });
  });

  it('assigns target the client token when only client has a token', async () => {
    const targetInstance = makeClient({ id: 2, groupToken: null });
    (Client.findByPk as jest.Mock)
      .mockResolvedValueOnce(makeClient({ id: 1, groupToken: 'client-token' }))
      .mockResolvedValueOnce(targetInstance);

    await deliveryGroupService.link(1, 2);

    expect(targetInstance.update).toHaveBeenCalledWith({ groupToken: 'client-token' });
  });

  it('merges both groups into client token when both have different tokens', async () => {
    (Client.findByPk as jest.Mock)
      .mockResolvedValueOnce(makeClient({ id: 1, groupToken: 'token-a' }))
      .mockResolvedValueOnce(makeClient({ id: 2, groupToken: 'token-b' }));
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await deliveryGroupService.link(1, 2);

    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: 'token-a' },
      { where: { groupToken: 'token-b' } },
    );
  });

  it('generates a new token and assigns it to both when neither has one', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: null });
    const targetInstance = makeClient({ id: 2, groupToken: null });
    (Client.findByPk as jest.Mock)
      .mockResolvedValueOnce(clientInstance)
      .mockResolvedValueOnce(targetInstance);

    await deliveryGroupService.link(1, 2);

    expect(clientInstance.update).toHaveBeenCalledWith({ groupToken: expect.any(String) });
    expect(targetInstance.update).toHaveBeenCalledWith({
      groupToken: expect.any(String),
    });
    const tokenA = clientInstance.update.mock.calls[0][0].groupToken;
    const tokenB = targetInstance.update.mock.calls[0][0].groupToken;
    expect(tokenA).toBe(tokenB);
  });

  it('throws when client is not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValueOnce(null);

    await expect(deliveryGroupService.link(999, 2)).rejects.toThrow();
  });

  it('throws when target is not found', async () => {
    (Client.findByPk as jest.Mock)
      .mockResolvedValueOnce(makeClient({ id: 1 }))
      .mockResolvedValueOnce(null);

    await expect(deliveryGroupService.link(1, 999)).rejects.toThrow();
  });
});

describe('deliveryGroupService.unlink', () => {
  it('clears groupToken on the client', async () => {
    const token = 'group-token';
    const clientInstance = makeClient({ id: 1, groupToken: token });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.count as jest.Mock).mockResolvedValue(2);

    await deliveryGroupService.unlink(1);

    expect(clientInstance.update).toHaveBeenCalledWith({ groupToken: null });
  });

  it('dissolves the group when only one member remains after unlinking', async () => {
    const token = 'group-token';
    const clientInstance = makeClient({ id: 1, groupToken: token });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    // after unlinking client 1, only 1 remains
    (Client.count as jest.Mock).mockResolvedValue(1);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await deliveryGroupService.unlink(1);

    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: null },
      { where: { groupToken: token } },
    );
  });

  it('does nothing when client has no group token', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: null });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);

    await deliveryGroupService.unlink(1);

    expect(clientInstance.update).not.toHaveBeenCalled();
    expect(Client.update).not.toHaveBeenCalled();
  });

  it('throws when client is not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(deliveryGroupService.unlink(999)).rejects.toThrow();
  });
});

describe('deliveryGroupService.findMembers', () => {
  it('returns id and name of all clients sharing the token', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([
      makeClient({ id: 1, name: 'Ana' }),
      makeClient({ id: 2, name: 'Luis' }),
    ]);

    const members = await deliveryGroupService.findMembers('some-token');

    expect(Client.findAll).toHaveBeenCalledWith({
      where: { groupToken: 'some-token' },
      attributes: ['id', 'name'],
    });
    expect(members).toEqual([
      { id: 1, name: 'Ana' },
      { id: 2, name: 'Luis' },
    ]);
  });

  it('returns empty array when no clients share the token', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    const members = await deliveryGroupService.findMembers('ghost-token');

    expect(members).toEqual([]);
  });
});
