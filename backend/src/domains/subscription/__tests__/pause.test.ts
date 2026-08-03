import Subscription from '../../../models/Subscription';
import sequelize from '../../../database/sequelize';
import { record } from '../../client-history';
import { pause } from '../pause';

jest.mock('../../../models/Subscription');
jest.mock('../../client-history');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn(), transaction: jest.fn() },
}));
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));

const actor = { userId: 9, username: 'ada' };
const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

describe('pause', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
  });

  const mockSub = (over: Record<string, unknown> = {}) => ({
    id: 5,
    clientId: 1,
    pausedSince: null,
    update: jest.fn().mockResolvedValue(undefined),
    ...over,
  });

  it('stamps pausedSince on the subscription', async () => {
    const subscription = mockSub();
    (Subscription.findByPk as jest.Mock).mockResolvedValue(subscription);

    await pause(5, actor);

    expect(subscription.update).toHaveBeenCalledWith(
      { pausedSince: expect.any(Date) },
      { transaction },
    );
  });

  it('records a paused history event against the subscription owner', async () => {
    (Subscription.findByPk as jest.Mock).mockResolvedValue(mockSub({ clientId: 42 }));

    await pause(5, actor);

    expect(record).toHaveBeenCalledWith(actor, { type: 'paused', clientId: 42 }, transaction);
  });

  it('leaves an already-paused subscription untouched so the days still owed are not reset', async () => {
    const subscription = mockSub({ pausedSince: new Date('2026-06-01') });
    (Subscription.findByPk as jest.Mock).mockResolvedValue(subscription);

    await pause(5, actor);

    expect(subscription.update).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('returns null when the subscription does not exist', async () => {
    (Subscription.findByPk as jest.Mock).mockResolvedValue(null);

    expect(await pause(999, actor)).toBeNull();
    expect(record).not.toHaveBeenCalled();
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    const subscription = mockSub();
    (Subscription.findByPk as jest.Mock).mockResolvedValue(subscription);

    await pause(5, actor, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(subscription.update).toHaveBeenCalledWith(expect.anything(), {
      transaction: callerTransaction,
    });
  });
});
