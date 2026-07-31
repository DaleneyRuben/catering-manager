import { Op } from 'sequelize';
import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import { appToday } from '../../../utils/date';
import { findHistoryForNutritionist } from '../find-history-for-nutritionist';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');
jest.mock('../../../utils/date');

describe('findHistoryForNutritionist', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (appToday as jest.Mock).mockReturnValue('2026-07-25');
    (Appointment.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });
  });

  it('returns rows and total', async () => {
    (Appointment.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

    const result = await findHistoryForNutritionist();

    expect(result.rows).toEqual([{ id: 1 }]);
    expect(result.total).toBe(1);
  });

  it('defaults to resolved appointments dated today or later, page 1, limit 25, newest first', async () => {
    await findHistoryForNutritionist();

    expect(Appointment.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: { [Op.gte]: '2026-07-25' },
          subscriptionId: { [Op.not]: null },
        }),
        include: [expect.objectContaining({ model: Subscription, required: true })],
        order: [
          ['date', 'DESC'],
          ['time', 'DESC'],
        ],
        limit: 25,
        offset: 0,
      }),
    );
  });

  it('paginates with the given page and limit', async () => {
    await findHistoryForNutritionist({ page: 3, limit: 10 });

    expect(Appointment.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 }),
    );
  });

  it('never queries earlier than today even when dateFrom is in the past', async () => {
    await findHistoryForNutritionist({ dateFrom: '2020-01-01' });

    const call = (Appointment.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.where.date).toEqual({ [Op.gte]: '2026-07-25' });
  });

  it('uses a future dateFrom as the lower bound', async () => {
    await findHistoryForNutritionist({ dateFrom: '2026-08-01' });

    const call = (Appointment.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.where.date).toEqual({ [Op.gte]: '2026-08-01' });
  });

  it('applies dateTo as an inclusive upper bound', async () => {
    await findHistoryForNutritionist({ dateFrom: '2026-08-01', dateTo: '2026-08-10' });

    const call = (Appointment.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.where.date).toEqual({ [Op.between]: ['2026-08-01', '2026-08-10'] });
  });

  it('filters paid appointments by status=pagado', async () => {
    await findHistoryForNutritionist({ status: 'pagado' });

    const call = (Appointment.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.include[0].where).toEqual({ paid: true });
  });

  it('filters unpaid appointments by status=no_pagado', async () => {
    await findHistoryForNutritionist({ status: 'no_pagado' });

    const call = (Appointment.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.include[0].where).toEqual({ paid: false });
  });

  it('searches by name or phone with q', async () => {
    await findHistoryForNutritionist({ q: 'Julia' });

    const call = (Appointment.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.where[Op.or]).toEqual([
      { name: { [Op.iLike]: '%Julia%' } },
      { phone: { [Op.iLike]: '%Julia%' } },
    ]);
  });
});
