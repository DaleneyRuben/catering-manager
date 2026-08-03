import { Op } from 'sequelize';
import Client from '../../../models/Client';
import sequelize from '../../../database/sequelize';
import { setDeliveryGroup } from '../set-delivery-group';

jest.mock('../../../models/Client');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn(), transaction: jest.fn() },
}));

const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

const makeClient = (overrides: object = {}) => ({
  id: 1,
  name: 'Ana',
  groupToken: null,
  update: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
});

describe('setDeliveryGroup', () => {
  it('clears client groupToken when memberIds is empty and client had a group', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'old-token' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.count as jest.Mock).mockResolvedValue(2);

    await setDeliveryGroup(1, []);

    expect(clientInstance.update).toHaveBeenCalledWith({ groupToken: null }, { transaction });
  });

  it('dissolves group when only one member remains after client leaves', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'old-token' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.count as jest.Mock).mockResolvedValue(1);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await setDeliveryGroup(1, []);

    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: null },
      { where: { groupToken: 'old-token' }, transaction },
    );
  });

  it('counts the remaining members inside the transaction that just removed the client', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'old-token' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.count as jest.Mock).mockResolvedValue(1);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await setDeliveryGroup(1, []);

    expect(Client.count).toHaveBeenCalledWith({ where: { groupToken: 'old-token' }, transaction });
  });

  it('does nothing when memberIds is empty and client had no group', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: null });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);

    await setDeliveryGroup(1, []);

    expect(clientInstance.update).not.toHaveBeenCalled();
    expect(Client.update).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('assigns a new token to client and all members when none have a token', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: null });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await setDeliveryGroup(1, [2, 3]);

    expect(clientInstance.update).toHaveBeenCalledWith(
      { groupToken: expect.any(String) },
      { transaction },
    );
    const newToken = clientInstance.update.mock.calls[0][0].groupToken;
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: newToken },
      { where: { id: [2, 3] }, transaction },
    );
  });

  it('reuses existing token without touching client row when adding members', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'existing-token' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await setDeliveryGroup(1, [2]);

    expect(clientInstance.update).not.toHaveBeenCalled();
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: 'existing-token' },
      { where: { id: [2] }, transaction },
    );
  });

  it('evicts members removed from the group without changing the token', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'tok' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await setDeliveryGroup(1, [2]);

    expect(clientInstance.update).not.toHaveBeenCalled();
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: null },
      { where: { groupToken: 'tok', id: { [Op.notIn]: [2, 1] } }, transaction },
    );
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: 'tok' },
      { where: { id: [2] }, transaction },
    );
  });

  it('rewrites the whole group in one transaction', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'tok' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await setDeliveryGroup(1, [2, 3]);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    const clientInstance = makeClient({ id: 1, groupToken: null });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockResolvedValue([1]);

    await setDeliveryGroup(1, [2], callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(Client.update).toHaveBeenCalledWith(
      { groupToken: expect.any(String) },
      { where: { id: [2] }, transaction: callerTransaction },
    );
  });

  it('leaves the members untouched when evicting the old ones fails', async () => {
    const clientInstance = makeClient({ id: 1, groupToken: 'tok' });
    (Client.findByPk as jest.Mock).mockResolvedValue(clientInstance);
    (Client.update as jest.Mock).mockRejectedValueOnce(new Error('db error'));

    await expect(setDeliveryGroup(1, [2])).rejects.toThrow('db error');
    expect(Client.update).toHaveBeenCalledTimes(1);
  });

  it('throws when client is not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(setDeliveryGroup(999, [1])).rejects.toThrow();
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });
});
