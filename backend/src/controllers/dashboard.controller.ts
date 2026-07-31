import { NextFunction, Request, Response } from 'express';
import { findBirthdays } from '../domains/client';
import { countDeliveriesToday } from '../domains/delivery';
import { findRecent } from '../domains/login-event';
import { findMenuStatus } from '../domains/menu';
import { findContractEnding, findSubscriptionCounts } from '../domains/subscription';
import { findConnections } from '../domains/user';
import { sendSuccess } from '../utils/response';

const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [counts, deliveriesToday, contractEnding, birthdays, connections, menus] =
      await Promise.all([
        findSubscriptionCounts(),
        countDeliveriesToday(),
        findContractEnding(),
        findBirthdays(),
        findConnections(),
        findMenuStatus(),
      ]);

    sendSuccess(res, {
      ...counts,
      deliveriesToday,
      contractEnding,
      birthdays,
      connections,
      menus,
    });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = typeof req.query.roles === 'string' ? req.query.roles.split(',') : undefined;
    const entries = await findRecent(roles);
    sendSuccess(res, entries);
  } catch (err) {
    next(err);
  }
};

export default { getSummary, getSessions };
