import { Op } from 'sequelize';
import Subscription from '../../../models/Subscription';
import { finalizeOverlappingSubscriptions } from '../finalize-overlapping';
import { appToday, subtractDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');

beforeEach(() => {
  jest.clearAllMocks();
});

const today = appToday();
const newStartDate = '2026-08-10';

const overlapping = () => ({
  id: 4,
  clientId: 1,
  contractEndDate: '2026-08-14',
  finalizedAt: null,
  update: jest.fn().mockResolvedValue({}),
});

describe('finalizeOverlappingSubscriptions', () => {
  it('ends an overlapping subscription the delivery day before the new plan starts', async () => {
    const sub = overlapping();
    (Subscription.findAll as jest.Mock).mockResolvedValue([sub]);

    await finalizeOverlappingSubscriptions(1, newStartDate);

    expect(sub.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: subtractDeliveryDays(newStartDate, 1) }),
    );
  });

  it('stamps finalizedAt with today', async () => {
    const sub = overlapping();
    (Subscription.findAll as jest.Mock).mockResolvedValue([sub]);

    await finalizeOverlappingSubscriptions(1, newStartDate);

    expect(sub.update).toHaveBeenCalledWith(expect.objectContaining({ finalizedAt: today }));
  });

  it('looks only at the client own unfinalized subscriptions running into the new start', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await finalizeOverlappingSubscriptions(1, newStartDate);

    expect(Subscription.findAll).toHaveBeenCalledWith({
      where: {
        clientId: 1,
        finalizedAt: null,
        contractEndDate: { [Op.gte]: newStartDate },
      },
    });
  });

  it('excludes the subscription being created or updated', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await finalizeOverlappingSubscriptions(1, newStartDate, 9);

    expect(Subscription.findAll).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: { [Op.ne]: 9 } }),
    });
  });

  it('finalizes every overlapping subscription, not just the first', async () => {
    const first = overlapping();
    const second = { ...overlapping(), id: 5 };
    (Subscription.findAll as jest.Mock).mockResolvedValue([first, second]);

    await finalizeOverlappingSubscriptions(1, newStartDate);

    expect(first.update).toHaveBeenCalled();
    expect(second.update).toHaveBeenCalled();
  });

  it('does nothing when no subscription overlaps', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await expect(finalizeOverlappingSubscriptions(1, newStartDate)).resolves.toBeUndefined();
  });

  it('threads the transaction through the lookup and the updates', async () => {
    const sub = overlapping();
    const transaction = { id: 'tx' } as never;
    (Subscription.findAll as jest.Mock).mockResolvedValue([sub]);

    await finalizeOverlappingSubscriptions(1, newStartDate, undefined, transaction);

    expect(Subscription.findAll).toHaveBeenCalledWith(expect.objectContaining({ transaction }));
    expect(sub.update).toHaveBeenCalledWith(expect.any(Object), { transaction });
  });
});
