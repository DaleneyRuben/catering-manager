import { Op } from 'sequelize';
import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';
import { escapeLikePattern } from '../../utils/search';

export interface FindHistoryFilters {
  status?: 'pagado' | 'no_pagado';
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const findHistoryForNutritionist = (filters: FindHistoryFilters = {}) => {
  const todayStr = appToday();
  const from = filters.dateFrom && filters.dateFrom > todayStr ? filters.dateFrom : todayStr;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string | symbol, any> = {
    date: filters.dateTo ? { [Op.between]: [from, filters.dateTo] } : { [Op.gte]: from },
    subscriptionId: { [Op.not]: null },
  };

  if (filters.q) {
    const q = `%${escapeLikePattern(filters.q)}%`;
    where[Op.or] = [{ name: { [Op.iLike]: q } }, { phone: { [Op.iLike]: q } }];
  }

  const subscriptionWhere: Record<string, boolean> = {};
  if (filters.status === 'pagado') subscriptionWhere.paid = true;
  if (filters.status === 'no_pagado') subscriptionWhere.paid = false;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 25;
  const offset = (page - 1) * limit;

  return Appointment.findAndCountAll({
    where,
    include: [
      {
        model: Subscription,
        attributes: ['paid'],
        ...(Object.keys(subscriptionWhere).length ? { where: subscriptionWhere } : {}),
        required: true,
      },
    ],
    order: [
      ['date', 'DESC'],
      ['time', 'DESC'],
    ],
    limit,
    offset,
  }).then(({ rows, count }) => ({ rows, total: count }));
};
