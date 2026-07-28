import { Op } from 'sequelize';
import Appointment from '../../../models/Appointment';
import ClientHistory from '../../../models/ClientHistory';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import { deleteUpcomingSubscription } from '../delete-upcoming-subscription';
import { appToday, addDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/ClientHistory');
jest.mock('../../../models/Plan');
jest.mock('../../../models/Appointment');

beforeEach(() => {
  jest.clearAllMocks();
});

const actor = { userId: 7, username: 'daleney' };

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

describe('deleteUpcomingSubscription', () => {
  it('returns null when the subscription does not belong to the client', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    expect(await deleteUpcomingSubscription(1, 9, actor)).toBeNull();
    expect(ClientHistory.create).not.toHaveBeenCalled();
  });

  it('deletes an upcoming subscription', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    const result = await deleteUpcomingSubscription(1, 9, actor);

    expect(sub.destroy).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 9 });
  });

  // Subscription is paranoid, but the raw subqueries in client/find-all.ts count rows directly and
  // never filter deletedAt — a soft-deleted renewal would keep counting as an upcoming plan there.
  it('removes the row outright rather than soft-deleting it', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

    expect(sub.destroy).toHaveBeenCalledWith({ force: true });
  });

  it('records a renewal_deleted history event with the deleted contract', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

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

  it('records when the deleted renewal had been registered', async () => {
    const sub = { ...upcoming(), createdAt: new Date('2026-06-19T09:40:00Z') };
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ registeredAt: sub.createdAt }),
      }),
    );
  });

  it('stamps the acting user on the history event', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, username: 'daleney' }),
    );
  });

  it('unlinks an appointment that resolved into the deleted renewal', async () => {
    const sub = upcoming();
    const appointment = { id: 3, date: startDate, update: jest.fn().mockResolvedValue({}) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });
    (Appointment.findOne as jest.Mock).mockResolvedValue(appointment);

    await deleteUpcomingSubscription(1, 9, actor);

    expect(Appointment.findOne).toHaveBeenCalledWith({ where: { subscriptionId: 9 } });
    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: null });
  });

  it('leaves the appointment date untouched so a past one is pruned instead of re-queued', async () => {
    const sub = upcoming();
    const appointment = { id: 3, date: '2020-01-02', update: jest.fn().mockResolvedValue({}) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });
    (Appointment.findOne as jest.Mock).mockResolvedValue(appointment);

    await deleteUpcomingSubscription(1, 9, actor);

    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: null });
  });

  it('deletes a renewal that no appointment resolved into', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });
    (Appointment.findOne as jest.Mock).mockResolvedValue(null);

    await deleteUpcomingSubscription(1, 9, actor);

    expect(sub.destroy).toHaveBeenCalled();
  });

  it('rejects with a 409 conflict when the subscription has already started', async () => {
    const running = { ...upcoming(), startDate: today };
    (Subscription.findOne as jest.Mock).mockResolvedValue(running);
    (Subscription.count as jest.Mock).mockResolvedValue(1);

    await expect(deleteUpcomingSubscription(1, 9, actor)).rejects.toMatchObject({ statusCode: 409 });
    expect(running.destroy).not.toHaveBeenCalled();
  });

  it('rejects with a 409 conflict when the client has no running plan behind it', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(0);

    await expect(deleteUpcomingSubscription(1, 9, actor)).rejects.toMatchObject({ statusCode: 409 });
    expect(sub.destroy).not.toHaveBeenCalled();
  });

  it('counts only the running plans of the client', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

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

    await deleteUpcomingSubscription(1, 9, actor);

    expect(sinFecha.destroy).toHaveBeenCalled();
  });
});
