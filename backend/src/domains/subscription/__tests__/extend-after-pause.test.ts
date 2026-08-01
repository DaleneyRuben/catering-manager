import Subscription from '../../../models/Subscription';
import { extendAfterPause } from '../extend-after-pause';

jest.mock('../../../models/Subscription');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));

describe('extendAfterPause', () => {
  beforeEach(() => jest.clearAllMocks());

  // Paused on Fri 15 May, 10 business days into a 20-day plan, so 10 delivery days are still
  // owed and the first of them is the delivery day after the resume date.
  it('re-ends the contract on the days still owed counted from the resume date', async () => {
    const sub = { id: 5, startDate: '2026-05-01', duration: 20, update: jest.fn() };
    (Subscription.findByPk as jest.Mock).mockResolvedValue(sub);

    await extendAfterPause(5, new Date('2026-05-15T12:00:00'));

    expect(sub.update).toHaveBeenCalledWith({ contractEndDate: '2026-06-19' });
  });

  it('leaves the contract alone when no delivery days are owed', async () => {
    const sub = { id: 5, startDate: '2026-05-01', duration: 10, update: jest.fn() };
    (Subscription.findByPk as jest.Mock).mockResolvedValue(sub);

    await extendAfterPause(5, new Date('2026-05-15T12:00:00'));

    expect(sub.update).not.toHaveBeenCalled();
  });

  it('does nothing for a subscription that never started', async () => {
    const sub = { id: 5, startDate: null, duration: 20, update: jest.fn() };
    (Subscription.findByPk as jest.Mock).mockResolvedValue(sub);

    await extendAfterPause(5, new Date('2026-05-15T12:00:00'));

    expect(sub.update).not.toHaveBeenCalled();
  });

  it('returns null when the subscription does not exist', async () => {
    (Subscription.findByPk as jest.Mock).mockResolvedValue(null);

    expect(await extendAfterPause(999, new Date('2026-05-15T12:00:00'))).toBeNull();
  });
});
