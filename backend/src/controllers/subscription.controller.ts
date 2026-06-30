import { NextFunction, Request, Response } from 'express';
import subscriptionCreateService from '../services/subscription/create.service';
import subscriptionUpdateService from '../services/subscription/update.service';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await subscriptionCreateService.create(
      decodeId(req.params.clientId),
      req.body,
    );
    if (!subscription) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, subscription, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await subscriptionUpdateService.update(
      decodeId(req.params.clientId),
      decodeId(req.params.id),
      req.body,
    );
    if (!subscription) {
      sendError(res, 'Subscription not found', 404);
      return;
    }
    sendSuccess(res, subscription);
  } catch (err) {
    next(err);
  }
};

export default { create, update };
