import { NextFunction, Request, Response } from 'express';
import * as dashboardService from '../services/dashboard';
import { findRecent } from '../services/login-event';
import { sendSuccess } from '../utils/response';

const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await dashboardService.findSummary();
    sendSuccess(res, summary);
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
