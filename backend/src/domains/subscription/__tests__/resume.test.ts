import Subscription from '../../../models/Subscription';
import sequelize from '../../../database/sequelize';
import { record } from '../../client-history';
import { extendAfterPause } from '../extend-after-pause';
import { resume } from '../resume';

jest.mock('../../../models/Subscription');
jest.mock('../../client-history');
jest.mock('../extend-after-pause');
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
const pausedSince = new Date('2026-06-03T15:00:00Z');

describe('resume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
  });

  const mockSub = (over: Record<string, unknown> = {}) => ({
    id: 5,
    clientId: 1,
    startDate: '2026-06-01',
    pausedSince,
    update: jest.fn().mockResolvedValue(undefined),
    ...over,
  });

  it('clears pausedSince on the subscription', async () => {
    const subscription = mockSub();
    (Subscription.findByPk as jest.Mock).mockResolvedValue(subscription);

    await resume(5, actor);

    expect(subscription.update).toHaveBeenCalledWith({ pausedSince: null }, { transaction });
  });

  it('extends the contract by the days still owed at the moment of the pause', async () => {
    (Subscription.findByPk as jest.Mock).mockResolvedValue(mockSub());

    await resume(5, actor);

    expect(extendAfterPause).toHaveBeenCalledWith(5, pausedSince, transaction);
  });

  it('records a plan_resumed history event against the subscription owner', async () => {
    (Subscription.findByPk as jest.Mock).mockResolvedValue(mockSub({ clientId: 42 }));

    await resume(5, actor);

    expect(record).toHaveBeenCalledWith(actor, { type: 'plan_resumed', clientId: 42 }, transaction);
  });

  // A sin-fecha renewal is paused without ever having delivered a day, so there is nothing owed.
  // Extending it would hand out free days for a pause that never withheld a meal.
  it('does not extend a paused subscription that never started', async () => {
    (Subscription.findByPk as jest.Mock).mockResolvedValue(mockSub({ startDate: null }));

    await resume(5, actor);

    expect(extendAfterPause).not.toHaveBeenCalled();
  });

  it('does nothing when the subscription is not paused', async () => {
    const subscription = mockSub({ pausedSince: null });
    (Subscription.findByPk as jest.Mock).mockResolvedValue(subscription);

    await resume(5, actor);

    expect(subscription.update).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
    expect(extendAfterPause).not.toHaveBeenCalled();
  });

  it('returns null when the subscription does not exist', async () => {
    (Subscription.findByPk as jest.Mock).mockResolvedValue(null);

    expect(await resume(999, actor)).toBeNull();
  });

  it('leaves the pause in place when extending the contract fails', async () => {
    const subscription = mockSub();
    (Subscription.findByPk as jest.Mock).mockResolvedValue(subscription);
    (extendAfterPause as jest.Mock).mockRejectedValueOnce(new Error('db error'));

    await expect(resume(5, actor)).rejects.toThrow('db error');
    expect(subscription.update).not.toHaveBeenCalled();
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    const subscription = mockSub();
    (Subscription.findByPk as jest.Mock).mockResolvedValue(subscription);

    await resume(5, actor, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(extendAfterPause).toHaveBeenCalledWith(5, pausedSince, callerTransaction);
  });
});
