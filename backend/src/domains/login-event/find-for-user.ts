import { Op } from 'sequelize';
import { subDays } from 'date-fns';
import LoginEvent from '../../models/LoginEvent';
import { WINDOW_DAYS } from './_helpers';

export type LoginEventEntry = {
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  createdAt: string;
};

export const findForUser = async (userId: number): Promise<LoginEventEntry[]> => {
  const events = await LoginEvent.findAll({
    where: { userId, createdAt: { [Op.gte]: subDays(new Date(), WINDOW_DAYS) } },
    order: [['createdAt', 'DESC']],
  });

  return events.map((event) => ({
    deviceType: event.deviceType,
    os: event.os,
    browser: event.browser,
    createdAt: (event.createdAt as Date).toISOString(),
  }));
};
