import sequelize from '../sequelize';
import { withTransaction } from '../with-transaction';

jest.mock('../sequelize', () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));

const ownTransaction = { id: 'own' } as never;
const callerTransaction = { id: 'caller' } as never;

describe('withTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((work) => work(ownTransaction));
  });

  it('opens its own transaction when the caller supplies none', async () => {
    const work = jest.fn().mockResolvedValue('done');

    const result = await withTransaction(undefined, work);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledWith(ownTransaction);
    expect(result).toBe('done');
  });

  it("joins the caller's transaction instead of opening a second one", async () => {
    const work = jest.fn().mockResolvedValue('done');

    const result = await withTransaction(callerTransaction, work);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(work).toHaveBeenCalledWith(callerTransaction);
    expect(result).toBe('done');
  });

  it('propagates a failure so the owning transaction rolls back', async () => {
    const boom = new Error('boom');
    const work = jest.fn().mockRejectedValue(boom);

    await expect(withTransaction(undefined, work)).rejects.toThrow('boom');
  });

  it("propagates a failure to the caller's transaction without swallowing it", async () => {
    const boom = new Error('boom');
    const work = jest.fn().mockRejectedValue(boom);

    await expect(withTransaction(callerTransaction, work)).rejects.toThrow('boom');
  });
});
