import { Op } from 'sequelize';
import ClientHistory from '../../../models/ClientHistory';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import { deleteRenewal } from '../delete-renewal';
import { appToday, addDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/ClientHistory');
jest.mock('../../../models/Plan');

beforeEach(() => {
  jest.clearAllMocks();
});

const today = appToday();
const startDate = addDeliveryDays(today, 5);

const upcoming = () => ({
  id: 9,
  clientId: 1,
  planId: 2,
  startDate,
  contractEndDate: addDeliveryDays(startDate, 19),
  duration: 20,
  discount: 0,
  finalizedAt: null,
  destroy: jest.fn().mockResolvedValue({}),
});

describe('deleteRenewal', () => {
  it('returns null when the subscription does not belong to the client', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    expect(await deleteRenewal(1, 9)).toBeNull();
    expect(ClientHistory.create).not.toHaveBeenCalled();
  });

  it('deletes an upcoming subscription', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    const result = await deleteRenewal(1, 9);

    expect(sub.destroy).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 9 });
  });

  it('records a renewal_deleted history event with the deleted contract', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteRenewal(1, 9);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 1,
        eventType: 'renewal_deleted',
        metadata: expect.objectContaining({
          planId: 2,
          planName: 'Completo',
          startDate: sub.startDate,
          contractEndDate: sub.contractEndDate,
          duration: 20,
        }),
      }),
    );
  });

  it('rejects with a 409 conflict when the subscription has already started', async () => {
    const running = { ...upcoming(), startDate: today };
    (Subscription.findOne as jest.Mock).mockResolvedValue(running);
    (Subscription.count as jest.Mock).mockResolvedValue(1);

    await expect(deleteRenewal(1, 9)).rejects.toMatchObject({ statusCode: 409 });
    expect(running.destroy).not.toHaveBeenCalled();
  });

  it('rejects with a 409 conflict when the client has no running plan behind it', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(0);

    await expect(deleteRenewal(1, 9)).rejects.toMatchObject({ statusCode: 409 });
    expect(sub.destroy).not.toHaveBeenCalled();
  });

  it('counts only the running plans of the client', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteRenewal(1, 9);

    expect(Subscription.count).toHaveBeenCalledWith({
      where: {
        clientId: 1,
        finalizedAt: null,
        startDate: { [Op.lte]: today },
        contractEndDate: { [Op.gte]: today },
      },
    });
  });

  it('deletes a renewal that is still waiting for a start date', async () => {
    const sinFecha = { ...upcoming(), startDate: null, contractEndDate: null };
    (Subscription.findOne as jest.Mock).mockResolvedValue(sinFecha);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteRenewal(1, 9);

    expect(sinFecha.destroy).toHaveBeenCalled();
  });
});
