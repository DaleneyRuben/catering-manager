import { NextFunction, Request, Response } from 'express';
import {
  create as createSubscription,
  update as updateSubscription,
  deleteUpcomingSubscription as deleteUpcoming,
} from '../domains/subscription';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await createSubscription(decodeId(req.params.clientId), req.body, {
      userId: req.user!.userId,
      username: req.user!.username,
    });
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
    const subscription = await updateSubscription(
      decodeId(req.params.clientId),
      decodeId(req.params.id),
      req.body,
      { userId: req.user!.userId, username: req.user!.username },
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

// Deletes an upcoming subscription only: the service rejects one that has already started or that
// is the client's only live plan, so this never ends a running contract (that is Finalizar).
const deleteUpcomingSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await deleteUpcoming(
      decodeId(req.params.clientId),
      decodeId(req.params.id),
      { userId: req.user!.userId, username: req.user!.username },
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

export default { create, update, deleteUpcomingSubscription };
