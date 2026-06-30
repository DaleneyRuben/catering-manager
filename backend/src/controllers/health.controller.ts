import { NextFunction, Request, Response } from 'express';
import healthService from '../services/health/health.service';
import { sendSuccess } from '../utils/response';

const getStatus = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await healthService.getReport();
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
};

export default { getStatus };
