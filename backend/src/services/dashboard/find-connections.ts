import { Op } from 'sequelize';
import User from '../../models/User';
import { ROLES } from '../../constants/roles';
import { SESSION_DURATION_HOURS } from '../../constants/session.constants';

export type Connection = {
  username: string;
  lastLoginAt: string;
  online: boolean;
  lastDeviceType: string | null;
  lastOs: string | null;
  lastBrowser: string | null;
};

const ONLINE_WINDOW_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

export const findConnections = async (): Promise<Connection[]> => {
  const users = await User.findAll({
    where: {
      role: { [Op.in]: [ROLES.KITCHEN, ROLES.DELIVERY] },
      lastLoginAt: { [Op.not]: null },
    },
    order: [['lastLoginAt', 'DESC']],
  });

  const now = Date.now();
  return users.map((user) => {
    const lastLoginAt = user.lastLoginAt as Date;
    return {
      username: user.username,
      lastLoginAt: lastLoginAt.toISOString(),
      online: now - lastLoginAt.getTime() <= ONLINE_WINDOW_MS,
      lastDeviceType: user.lastDeviceType,
      lastOs: user.lastOs,
      lastBrowser: user.lastBrowser,
    };
  });
};
