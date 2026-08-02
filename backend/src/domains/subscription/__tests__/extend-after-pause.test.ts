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

  // A suspended day is one the client paid for and did not receive. The contract end date had
  // already been pushed out to cover it, so recalculating on resume must not drop it.
  it('keeps the contract long enough to cover days suspended after the resume date', async () => {
    const sub = {
      id: 5,
      startDate: '2026-06-01',
      duration: 20,
      suspendedDates: ['2026-06-10', '2026-06-11'],
      update: jest.fn(),
    };
    (Subscription.findByPk as jest.Mock).mockResolvedValue(sub);

    await extendAfterPause(5, new Date('2026-06-05T12:00:00'));

    // 16 days owed from the mocked today of 05/06 would end on 29/06, but the two suspended
    // days are not deliveries, so the contract has to run two days further.
    expect(sub.update).toHaveBeenCalledWith({ contractEndDate: '2026-07-01' });
  });

  it('does not count days suspended before the pause as elapsed', async () => {
    const sub = {
      id: 5,
      startDate: '2026-05-01',
      duration: 20,
      suspendedDates: ['2026-05-08'],
      update: jest.fn(),
    };
    (Subscription.findByPk as jest.Mock).mockResolvedValue(sub);

    await extendAfterPause(5, new Date('2026-05-15T12:00:00'));

    // 10 business days elapsed minus the 1 suspended day inside that window = 9 consumed,
    // so 11 are still owed instead of 10.
    expect(sub.update).toHaveBeenCalledWith({ contractEndDate: '2026-06-22' });
  });
});
