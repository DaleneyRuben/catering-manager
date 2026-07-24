import Client from '../../../models/Client';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import { findPendingPayment } from '../find-pending-payment';

jest.mock('../../../models/Client');

describe('findPendingPayment', () => {
  beforeEach(() => jest.resetAllMocks());

  it('queries clients with an unpaid subscription, newest first', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    await findPendingPayment();

    expect(Client.findAll).toHaveBeenCalledWith({
      include: [{ model: Subscription, include: [Plan], required: true, where: { paid: false } }],
      order: [['createdAt', 'DESC']],
    });
  });
});
