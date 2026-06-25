import { NextFunction, Request, Response } from 'express';
import deliveryService from '../services/delivery.service';
import { sendSuccess } from '../utils/response';

const getRoute = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const route = await deliveryService.findRoute();
    sendSuccess(res, route);
  } catch (err) {
    next(err);
  }
};

export default { getRoute };
