import Subscription from '../../../models/Subscription';
import { finalize } from '../finalize';

jest.mock('../../../models/Subscription');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));

describe('finalize', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ends the subscription today and stamps finalizedAt', async () => {
    const sub = { id: 5, update: jest.fn().mockResolvedValue({}) };
    (Subscription.findByPk as jest.Mock).mockResolvedValue(sub);

    await finalize(5);

    expect(sub.update).toHaveBeenCalledWith({
      contractEndDate: '2026-06-05',
      finalizedAt: '2026-06-05',
    });
  });

  it('returns null when the subscription does not exist', async () => {
    (Subscription.findByPk as jest.Mock).mockResolvedValue(null);

    expect(await finalize(999)).toBeNull();
  });

  it('threads the transaction through both the read and the write', async () => {
    const sub = { id: 5, update: jest.fn().mockResolvedValue({}) };
    (Subscription.findByPk as jest.Mock).mockResolvedValue(sub);
    const transaction = {} as never;

    await finalize(5, transaction);

    expect(Subscription.findByPk).toHaveBeenCalledWith(5, { transaction });
    expect(sub.update).toHaveBeenCalledWith(expect.any(Object), { transaction });
  });
});
