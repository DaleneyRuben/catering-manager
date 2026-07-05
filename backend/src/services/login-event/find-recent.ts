import { Op } from 'sequelize';
import { subDays } from 'date-fns';
import LoginEvent from '../../models/LoginEvent';
import User from '../../models/User';
import { WINDOW_DAYS } from './_helpers';

export type RecentLoginEntry = {
  username: string;
  role: string;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  createdAt: string;
};

export const findRecent = async (): Promise<RecentLoginEntry[]> => {
  const events = await LoginEvent.findAll({
    where: { createdAt: { [Op.gte]: subDays(new Date(), WINDOW_DAYS) } },
    include: [{ model: User, attributes: ['username', 'role'] }],
    order: [['createdAt', 'DESC']],
  });

  return events.map((event) => ({
    username: event.user.username,
    role: event.user.role,
    deviceType: event.deviceType,
    os: event.os,
    browser: event.browser,
    createdAt: (event.createdAt as Date).toISOString(),
  }));
};
