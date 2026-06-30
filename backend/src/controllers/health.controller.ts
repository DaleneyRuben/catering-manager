import { NextFunction, Request, Response } from 'express';
import { getReport as healthGetReport } from '../services/health';
import { sendSuccess } from '../utils/response';

const getStatus = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await healthGetReport();
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
};

export default { getStatus };
