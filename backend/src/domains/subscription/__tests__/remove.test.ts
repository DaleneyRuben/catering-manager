import Subscription from '../../../models/Subscription';
import { remove } from '../remove';

jest.mock('../../../models/Subscription');

describe('remove', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes a single subscription by id', async () => {
    await remove(3);

    expect(Subscription.destroy).toHaveBeenCalledWith({ where: { id: [3] } });
  });

  it('deletes several subscriptions in one statement', async () => {
    await remove([3, 4, 5]);

    expect(Subscription.destroy).toHaveBeenCalledWith({ where: { id: [3, 4, 5] } });
  });

  it('does nothing when given an empty list', async () => {
    await remove([]);

    expect(Subscription.destroy).not.toHaveBeenCalled();
  });

  it('threads the transaction through', async () => {
    const transaction = {} as never;

    await remove(3, transaction);

    expect(Subscription.destroy).toHaveBeenCalledWith({ where: { id: [3] }, transaction });
  });
});
