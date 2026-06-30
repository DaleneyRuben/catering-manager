import { Op } from 'sequelize';
import Client from '../../models/Client';
import deliveryGroupService from '../delivery/group.service';

jest.mock('../../models/Client');

const makeClient = (overrides: object = {}) => ({
  id: 1,
  name: 'Ana',
  groupToken: null,
  update: jest.fn(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('deliveryGroupService.setGroup', () => {
  it('clears client groupToken when memberIds is empty and client had a group', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'old-token' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.count as jest.Mock).mockResolvedValue(2);

    await deliveryGroupService.setGroup(1, []);

    expect(clientInstance.update).toHaveBeenCalledWith({ groupToken: null });
  });

  it('dissolves group when only one member remains after client leaves', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'old-token' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.count as jest.Mock).mockResolvedValue(1);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await deliveryGroupService.setGroup(1, []);

    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: null },
      { where: { groupToken: 'old-token' } },
    );
  });

  it('does nothing when memberIds is empty and client had no group', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: null });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);

    await deliveryGroupService.setGroup(1, []);

    expect(clientInstance.update).not.toHaveBeenCalled();
    expect(Client.update).not.toHaveBeenCalled();
  });

  it('assigns a new token to client and all members when none have a token', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: null });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await deliveryGroupService.setGroup(1, [2, 3]);

    expect(clientInstance.update).toHaveBeenCalledWith({ groupToken: expect.any(String) });
    const newToken = clientInstance.update.mock.calls[0][0].groupToken;
    expect(Client.update).toHaveBeenCalledWith({ groupToken: newToken }, { where: { id: [2, 3] } });
  });

  it('reuses existing token without touching client row when adding members', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'existing-token' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await deliveryGroupService.setGroup(1, [2]);

    expect(clientInstance.update).not.toHaveBeenCalled();
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: 'existing-token' },
      { where: { id: [2] } },
    );
  });

  it('evicts members removed from the group without changing the token', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'tok' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    // client 1 had members [2, 3] — now saving with only [2], so 3 should be evicted
    await deliveryGroupService.setGroup(1, [2]);

    expect(clientInstance.update).not.toHaveBeenCalled();
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: null },
      { where: { groupToken: 'tok', id: { [Op.notIn]: [2, 1] } } },
    );
    expect(Client.update).toHaveBeenCalledWith({ groupToken: 'tok' }, { where: { id: [2] } });
  });

  it('preserves token on re-save with same members', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'stable-token' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await deliveryGroupService.setGroup(1, [2]);

    expect(clientInstance.update).not.toHaveBeenCalled();
    // eviction call should pass [2, 1] as the notIn list — no one is actually evicted, but the call happens
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: null },
      { where: { groupToken: 'stable-token', id: { [Op.notIn]: [2, 1] } } },
    );
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: 'stable-token' },
      { where: { id: [2] } },
    );
  });

  it('throws when client is not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(deliveryGroupService.setGroup(999, [1])).rejects.toThrow();
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
