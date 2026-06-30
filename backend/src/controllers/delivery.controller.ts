import { NextFunction, Request, Response } from 'express';
import { findRoute } from '../services/delivery';
import { sendSuccess } from '../utils/response';

const getRoute = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const route = await findRoute();
    sendSuccess(res, route);
  } catch (err) {
    next(err);
  }
};

export default { getRoute };
