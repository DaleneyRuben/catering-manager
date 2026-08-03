import Client from '../../../models/Client';
import sequelize from '../../../database/sequelize';
import { record } from '../../client-history';
import { softDelete } from '../soft-delete';

jest.mock('../../../models/Client');
jest.mock('../../client-history');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn(), transaction: jest.fn() },
}));

const actor = { userId: 9, username: 'ada' };
const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

describe('softDelete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
  });

  it('calls destroy on the client and records deleted history event', async () => {
    const mockInstance = {
      id: 1,
      destroy: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await softDelete(1, actor);

    expect(mockInstance.destroy).toHaveBeenCalledWith({ transaction });
    expect(record).toHaveBeenCalledWith(actor, { type: 'deleted', clientId: 1 }, transaction);
  });

  it('records the acting user on the history event', async () => {
    const mockInstance = {
      id: 1,
      destroy: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await softDelete(1, actor);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
      expect.anything(),
      expect.anything(),
    );
  });

  it('deletes the client and records the event in one transaction', async () => {
    const mockInstance = { id: 1, destroy: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await softDelete(1, actor);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    const mockInstance = { id: 1, destroy: jest.fn().mockResolvedValue({}) };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await softDelete(1, actor, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(mockInstance.destroy).toHaveBeenCalledWith({ transaction: callerTransaction });
    expect(record).toHaveBeenCalledWith(actor, { type: 'deleted', clientId: 1 }, callerTransaction);
  });

  it('leaves the history event unwritten when the delete fails', async () => {
    const mockInstance = {
      id: 1,
      destroy: jest.fn().mockRejectedValue(new Error('db error')),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(softDelete(1, actor)).rejects.toThrow('db error');
    expect(record).not.toHaveBeenCalled();
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await softDelete(999, actor);

    expect(result).toBeNull();
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(softDelete(1, actor)).rejects.toThrow('db error');
  });
});
