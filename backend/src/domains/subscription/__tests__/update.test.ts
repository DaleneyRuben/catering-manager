import { Op } from 'sequelize';
import Subscription from '../../../models/Subscription';
import Client from '../../../models/Client';
import Plan from '../../../models/Plan';
import sequelize from '../../../database/sequelize';
import { record } from '../../client-history';
import { update } from '../update';
import { addDeliveryDays, subtractDeliveryDays } from '../../../utils/date';

jest.mock('../../../models/Subscription');
jest.mock('../../../models/Client');
jest.mock('../../client-history');
jest.mock('../../../models/Plan');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));

const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

beforeEach(() => {
  jest.clearAllMocks();
  (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
});

const actor = { userId: 9, username: 'ada' };

describe('update', () => {
  it('updates a subscription and returns the updated instance', async () => {
    const updated = { id: 1, clientId: 1, contractEndDate: '2026-06-30' };
    const mockInstance = { update: jest.fn().mockResolvedValue(updated) };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    const result = await update(1, 1, { contractEndDate: '2026-06-30' }, actor);

    expect(mockInstance.update).toHaveBeenCalledWith(
      { contractEndDate: '2026-06-30' },
      {
        transaction,
      },
    );
    expect(result).toMatchObject({ contractEndDate: '2026-06-30' });
  });

  it('returns null when subscription not found', async () => {
    (Subscription.findOne as jest.Mock).mockResolvedValue(null);

    const result = await update(1, 999, { contractEndDate: '2026-06-30' }, actor);

    expect(result).toBeNull();
  });

  it('recalculates contractEndDate when startDate changes using existing duration', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { startDate: '2026-06-01' }, actor);

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: addDeliveryDays('2026-06-01', 19) }),
      { transaction },
    );
  });

  it('extends contractEndDate by 1 delivery day per newly added suspension', async () => {
    const baseEnd = '2026-06-22';
    const mockInstance = {
      suspendedDates: [],
      contractEndDate: baseEnd,
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await update(1, 1, { suspendedDates: ['2026-06-10'] }, actor);

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: addDeliveryDays(baseEnd, 1) }),
      { transaction },
    );
  });

  it('records the acting user on the contract_updated history event', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, 1, { startDate: '2026-06-01' }, actor);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
      expect.anything(),
      transaction,
    );
  });

  // An edit to the contract dates is not a plan being put in place, so it no longer borrows
  // plan_assigned's type — and it carries no plan fields to borrow it with.
  it('records a contract_updated event carrying only the new contract dates', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { startDate: '2026-06-01' }, actor);

    expect(record).toHaveBeenCalledWith(
      actor,
      {
        type: 'contract_updated',
        clientId: 1,
        metadata: {
          startDate: '2026-06-01',
          duration: 20,
          contractEndDate: addDeliveryDays('2026-06-01', 19),
        },
      },
      transaction,
    );
  });

  it('records suspended history event when dates are added', async () => {
    const mockInstance = {
      id: 1,
      clientId: 1,
      suspendedDates: [],
      contractEndDate: '2026-06-22',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, 1, { suspendedDates: ['2026-06-10'] }, actor);

    expect(record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ type: 'suspended', clientId: 1 }),
      transaction,
    );
  });

  it('records the acting user on the suspended history event', async () => {
    const mockInstance = {
      id: 1,
      clientId: 1,
      suspendedDates: [],
      contractEndDate: '2026-06-22',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (record as jest.Mock).mockResolvedValue(undefined);

    await update(1, 1, { suspendedDates: ['2026-06-10'] }, actor);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, username: 'ada' }),
      expect.anything(),
      transaction,
    );
  });

  it('extends contractEndDate by surviving suspended dates when duration changes', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-06-04',
      duration: 20,
      contractEndDate: addDeliveryDays(addDeliveryDays('2026-06-04', 19), 2), // base + 2 suspensions
      suspendedDates: ['2026-06-10', '2026-06-11'],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { duration: 15 }, actor);

    // base end = 2026-06-04 + 14 delivery days; then +2 for the surviving suspensions
    const baseEnd = addDeliveryDays('2026-06-04', 14);
    const expectedEnd = addDeliveryDays(baseEnd, 2);
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: expectedEnd }),
      { transaction },
    );
  });

  it('extends contractEndDate by surviving suspended dates when startDate changes', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays(addDeliveryDays('2026-05-26', 19), 3),
      suspendedDates: ['2026-05-27', '2026-06-10', '2026-06-11'], // 2026-05-27 will be removed
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { startDate: '2026-06-01' }, actor);

    // surviving suspensions: ['2026-06-10', '2026-06-11'] (2026-05-27 < new startDate)
    const baseEnd = addDeliveryDays('2026-06-01', 19);
    const expectedEnd = addDeliveryDays(baseEnd, 2);
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: expectedEnd }),
      { transaction },
    );
  });

  it('finalizes other overlapping subscriptions when a startDate is assigned', async () => {
    const otherSub = { id: 7, update: jest.fn().mockResolvedValue({}) };
    const mockInstance = {
      id: 3,
      clientId: 1,
      startDate: null,
      duration: 20,
      contractEndDate: null,
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Subscription.findAll as jest.Mock).mockResolvedValue([otherSub]);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 3, { startDate: '2026-07-03' }, actor);

    expect(Subscription.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: 1,
          finalizedAt: null,
          contractEndDate: { [Op.gte]: '2026-07-03' },
          id: { [Op.ne]: 3 },
        }),
        transaction,
      }),
    );
    expect(otherSub.update).toHaveBeenCalledWith(
      expect.objectContaining({
        contractEndDate: subtractDeliveryDays('2026-07-03', 1),
      }),
      { transaction },
    );
  });

  it('does not look for overlaps when startDate is not being assigned', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { duration: 30 }, actor);

    expect(Subscription.findAll).not.toHaveBeenCalled();
  });

  // Giving a sin-fecha renewal its start date un-pauses that renewal — and nothing else. The
  // client record no longer carries a pause for this to have to reach across and clear.
  it('clears its own pausedSince when a startDate is assigned', async () => {
    const client = { id: 1, update: jest.fn() };
    const mockInstance = {
      id: 3,
      clientId: 1,
      startDate: null,
      duration: 20,
      contractEndDate: null,
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Client.findByPk as jest.Mock).mockResolvedValue(client);

    await update(1, 3, { startDate: '2026-07-03' }, actor);

    expect(client.update).not.toHaveBeenCalled();
    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ pausedSince: null }),
      { transaction },
    );
  });

  it('writes the contract_updated event only after the subscription it describes', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { startDate: '2026-06-01' }, actor);

    const [updateOrder] = mockInstance.update.mock.invocationCallOrder;
    const [recordOrder] = (record as jest.Mock).mock.invocationCallOrder;
    expect(recordOrder).toBeGreaterThan(updateOrder);
  });

  it('writes the suspended event only after the subscription it describes', async () => {
    const mockInstance = {
      id: 1,
      clientId: 1,
      suspendedDates: [],
      contractEndDate: '2026-06-22',
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await update(1, 1, { suspendedDates: ['2026-06-10'] }, actor);

    const [updateOrder] = mockInstance.update.mock.invocationCallOrder;
    const [recordOrder] = (record as jest.Mock).mock.invocationCallOrder;
    expect(recordOrder).toBeGreaterThan(updateOrder);
  });

  it('leaves no history event behind when the subscription update fails', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockRejectedValue(new Error('db error')),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await expect(update(1, 1, { startDate: '2026-06-01' }, actor)).rejects.toThrow('db error');
    expect(record).not.toHaveBeenCalled();
  });

  it('records a plan_changed event when the assigned plan changes', async () => {
    const mockInstance = {
      clientId: 1,
      planId: 2,
      discount: 100,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Plan.findByPk as jest.Mock)
      .mockResolvedValueOnce({ id: 2, name: 'Ligero', price: 1200 })
      .mockResolvedValueOnce({ id: 5, name: 'Completo', price: 1800 });

    await update(1, 1, { planId: 5 }, actor);

    expect(record).toHaveBeenCalledWith(
      actor,
      {
        type: 'plan_changed',
        clientId: 1,
        metadata: {
          planId: 5,
          planName: 'Completo',
          planPrice: 1800,
          previousPlanId: 2,
          previousPlanName: 'Ligero',
          discount: 100,
          previousDiscount: 100,
        },
      },
      transaction,
    );
  });

  // The discount is what the client actually pays, so moving it is a change to the commercial
  // terms even when the plan behind it stays put.
  it('records a plan_changed event when only the discount changes', async () => {
    const mockInstance = {
      clientId: 1,
      planId: 2,
      discount: 100,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Ligero', price: 1200 });

    await update(1, 1, { discount: 250 }, actor);

    expect(record).toHaveBeenCalledWith(
      actor,
      {
        type: 'plan_changed',
        clientId: 1,
        metadata: {
          planId: 2,
          planName: 'Ligero',
          planPrice: 1200,
          previousPlanId: 2,
          previousPlanName: 'Ligero',
          discount: 250,
          previousDiscount: 100,
        },
      },
      transaction,
    );
    // the plan on both sides of the change is the same row — reading it twice would be waste
    expect(Plan.findByPk).toHaveBeenCalledTimes(1);
  });

  it('does not record plan_changed when neither the plan nor the discount moves', async () => {
    const mockInstance = {
      clientId: 1,
      planId: 2,
      discount: 100,
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);

    await update(
      1,
      1,
      { planId: 2, discount: 100, specialInstructions: { lunch: 'GRANDE' } },
      actor,
    );

    expect(record).not.toHaveBeenCalled();
  });

  it('writes the plan_changed event only after the subscription it describes', async () => {
    const mockInstance = {
      clientId: 1,
      planId: 2,
      discount: 100,
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, name: 'Ligero', price: 1200 });

    await update(1, 1, { discount: 250 }, actor);

    const [updateOrder] = mockInstance.update.mock.invocationCallOrder;
    const [recordOrder] = (record as jest.Mock).mock.invocationCallOrder;
    expect(recordOrder).toBeGreaterThan(updateOrder);
  });

  it('changes the plan and records the event in one transaction', async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { startDate: '2026-06-01' }, actor);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    const mockInstance = {
      clientId: 1,
      startDate: '2026-05-26',
      duration: 20,
      contractEndDate: addDeliveryDays('2026-05-26', 19),
      suspendedDates: [],
      update: jest.fn().mockResolvedValue({}),
    };
    (Subscription.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 1, update: jest.fn() });

    await update(1, 1, { startDate: '2026-06-01' }, actor, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(mockInstance.update).toHaveBeenCalledWith(expect.anything(), {
      transaction: callerTransaction,
    });
    expect(record).toHaveBeenCalledWith(actor, expect.anything(), callerTransaction);
  });
});
