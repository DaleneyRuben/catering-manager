import Client from '../../../models/Client';
import sequelize from '../../../database/sequelize';
import { record } from '../../client-history';
import { finalize as finalizeSubscription } from '../../subscription';
import { finalize } from '../finalize';

const actor = { userId: 9, username: 'ada' };
const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

jest.mock('../../../models/Client');
jest.mock('../../client-history');
jest.mock('../../subscription');
jest.mock('../../../models/Subscription');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn(), transaction: jest.fn() },
}));
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));

describe('finalize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
  });

  it('finalizes the current subscription and records a plan_finalized history event', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [{ id: 5 }],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await finalize(1, actor);

    expect(finalizeSubscription).toHaveBeenCalledWith(5, transaction);
    expect(record).toHaveBeenCalledWith(
      actor,
      { type: 'plan_finalized', clientId: 1 },
      transaction,
    );
  });

  it('records the acting user on the history event', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [{ id: 5 }],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await finalize(1, actor);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
      expect.anything(),
      expect.anything(),
    );
  });

  it('ends the plan and records the event in one transaction', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [{ id: 5 }],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await finalize(1, actor);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [{ id: 5 }],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await finalize(1, actor, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(finalizeSubscription).toHaveBeenCalledWith(5, callerTransaction);
    expect(record).toHaveBeenCalledWith(
      actor,
      { type: 'plan_finalized', clientId: 1 },
      callerTransaction,
    );
  });

  it('leaves the history event unwritten when finalizing the subscription fails', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [{ id: 5 }],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (finalizeSubscription as jest.Mock).mockRejectedValueOnce(new Error('db error'));

    await expect(finalize(1, actor)).rejects.toThrow('db error');
    expect(record).not.toHaveBeenCalled();
  });

  it('still records the history event when the client has no subscription', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await finalize(1, actor);

    expect(finalizeSubscription).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith(
      actor,
      { type: 'plan_finalized', clientId: 1 },
      transaction,
    );
  });

  it('finalizes the paid subscription, not a newer pending unpaid renewal', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [
        { id: 66, paid: false },
        { id: 60, paid: true },
      ],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await finalize(1, actor);

    expect(finalizeSubscription).toHaveBeenCalledWith(60, transaction);
    expect(finalizeSubscription).not.toHaveBeenCalledWith(66, transaction);
  });

  it('finalizes the subscription covering today, not a queued future renewal', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [
        { id: 8, startDate: '2026-07-01', contractEndDate: '2026-07-30', finalizedAt: null },
        { id: 5, startDate: '2026-05-01', contractEndDate: '2026-06-20', finalizedAt: null },
      ],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await finalize(1, actor);

    expect(finalizeSubscription).toHaveBeenCalledWith(5, transaction);
    expect(finalizeSubscription).not.toHaveBeenCalledWith(8, transaction);
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await finalize(999, actor);

    expect(result).toBeNull();
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(finalize(1, actor)).rejects.toThrow('db error');
  });
});
