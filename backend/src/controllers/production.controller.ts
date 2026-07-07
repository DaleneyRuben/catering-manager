import { NextFunction, Request, Response } from 'express';
import * as productionService from '../services/production';
import { sendSuccess } from '../utils/response';

const getGroups = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [summary, weeklyCounts] = await Promise.all([
      productionService.findGroups(),
      productionService.findWeeklyCounts(),
    ]);
    sendSuccess(res, { ...summary, weeklyCounts });
  } catch (err) {
    next(err);
  }
};

export default { getGroups };
