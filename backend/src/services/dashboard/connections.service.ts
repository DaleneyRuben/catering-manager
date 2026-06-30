import { Op } from 'sequelize';
import User from '../../models/User';
import { ROLES } from '../../constants/roles';

const ONLINE_WINDOW_MS = 60 * 60 * 1000;

export type Connection = {
  username: string;
  lastLoginAt: string;
  online: boolean;
};

const findConnections = async (): Promise<Connection[]> => {
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
    };
  });
};

export default { findConnections };
