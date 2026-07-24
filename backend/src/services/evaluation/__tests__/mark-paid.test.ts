import ClientHistory from '../../../models/ClientHistory';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import { markPaid } from '../mark-paid';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/Plan');
jest.mock('../../../models/ClientHistory');

describe('markPaid', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns null when the client has no unpaid subscription', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await markPaid(1);

    expect(result).toBeNull();
    expect(ClientHistory.create).not.toHaveBeenCalled();
  });

  it('marks the subscription paid and logs a plan_assigned history event', async () => {
    const subscription = {
      id: 3,
      clientId: 1,
      planId: 2,
      startDate: '2026-07-27',
      duration: 20,
      contractEndDate: '2026-08-21',
      discount: 500,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(subscription);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    const result = await markPaid(1);

    expect(Subscription.findOne).toHaveBeenCalledWith({ where: { clientId: 1, paid: false } });
    expect(subscription.update).toHaveBeenCalledWith({ paid: true });
    expect(ClientHistory.create).toHaveBeenCalledWith({
      clientId: 1,
      eventType: 'plan_assigned',
      occurredAt: expect.any(Date),
      metadata: {
        planId: 2,
        planName: 'Completo',
        planPrice: 5000,
        startDate: '2026-07-27',
        duration: 20,
        contractEndDate: '2026-08-21',
        discount: 500,
      },
    });
    expect(result).toBe(subscription);
  });
});
