import { NextFunction, Request, Response } from 'express';
import { findSummary } from '../services/dashboard';
import { sendSuccess } from '../utils/response';

const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await findSummary();
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

export default { getSummary };
