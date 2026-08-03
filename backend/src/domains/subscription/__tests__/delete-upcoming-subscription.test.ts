import { Op } from 'sequelize';
import Appointment from '../../../models/Appointment';
import Plan from '../../../models/Plan';
import Subscription from '../../../models/Subscription';
import sequelize from '../../../database/sequelize';
import { record } from '../../client-history';
import { deleteUpcomingSubscription } from '../delete-upcoming-subscription';
import { appToday, addDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../client-history');
jest.mock('../../../models/Plan');
jest.mock('../../../models/Appointment');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn(), transaction: jest.fn() },
}));

const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

beforeEach(() => {
  jest.clearAllMocks();
  (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
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
    expect(record).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
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

  it('removes the row outright rather than leaving a deleted one behind', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

    expect(sub.destroy).toHaveBeenCalledWith({ transaction });
  });

  it('records a renewal_deleted history event with the deleted contract', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({
        type: 'renewal_deleted',
        clientId: 1,
        metadata: expect.objectContaining({
          planId: 2,
          planName: 'Completo',
          startDate: sub.startDate,
          contractEndDate: sub.contractEndDate,
          duration: 20,
        }),
      }),
      transaction,
    );
  });

  it('records when the deleted renewal had been registered', async () => {
    const sub = { ...upcoming(), createdAt: new Date('2026-06-19T09:40:00Z') };
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({
        metadata: expect.objectContaining({ registeredAt: sub.createdAt }),
      }),
      transaction,
    );
  });

  it('stamps the acting user on the history event', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, username: 'daleney' }),
      expect.anything(),
      expect.anything(),
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

    expect(Appointment.findOne).toHaveBeenCalledWith({ where: { subscriptionId: 9 }, transaction });
    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: null }, { transaction });
  });

  it('leaves the appointment date untouched so a past one is pruned instead of re-queued', async () => {
    const sub = upcoming();
    const appointment = { id: 3, date: '2020-01-02', update: jest.fn().mockResolvedValue({}) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });
    (Appointment.findOne as jest.Mock).mockResolvedValue(appointment);

    await deleteUpcomingSubscription(1, 9, actor);

    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: null }, { transaction });
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

    await expect(deleteUpcomingSubscription(1, 9, actor)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(running.destroy).not.toHaveBeenCalled();
  });

  it('rejects with a 409 conflict when the client has no running plan behind it', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(0);

    await expect(deleteUpcomingSubscription(1, 9, actor)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(sub.destroy).not.toHaveBeenCalled();
  });

  // The guard reads the client's other subscriptions. Counted outside the transaction it would
  // miss a plan the same workflow just finalized, and let the client's last renewal go with it.
  it('counts the running plans inside the transaction that deletes the renewal', async () => {
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
      transaction,
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

  it('unlinks the appointment, deletes the row and records history in one transaction', async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });
    (Appointment.findOne as jest.Mock).mockResolvedValue({
      id: 3,
      update: jest.fn().mockResolvedValue({}),
    });

    await deleteUpcomingSubscription(1, 9, actor);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    const sub = upcoming();
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await deleteUpcomingSubscription(1, 9, actor, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(sub.destroy).toHaveBeenCalledWith({ transaction: callerTransaction });
    expect(record).toHaveBeenCalledWith(actor, expect.anything(), callerTransaction);
  });

  it('leaves the appointment linked and the history unwritten when the delete fails', async () => {
    const sub = { ...upcoming(), destroy: jest.fn().mockRejectedValue(new Error('db error')) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(sub);
    (Subscription.count as jest.Mock).mockResolvedValue(1);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Completo', price: 5000 });

    await expect(deleteUpcomingSubscription(1, 9, actor)).rejects.toThrow('db error');
    expect(record).not.toHaveBeenCalled();
  });
});
