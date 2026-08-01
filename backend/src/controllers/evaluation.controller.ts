import { NextFunction, Request, Response } from 'express';
import {
  findPendingPayment,
  revertPendingRenewal as revertRenewal,
  deletePendingClient,
} from '../domains/evaluation';
import { markPaid as markSubscriptionPaid } from '../domains/subscription';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const getPendingPayment = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await findPendingPayment());
  } catch (err) {
    next(err);
  }
};

const markPaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await markSubscriptionPaid(decodeId(req.params.id), {
      userId: req.user!.userId,
      username: req.user!.username,
    });
    if (!subscription) {
      sendError(res, 'Client has no pending payment', 404);
      return;
    }
    sendSuccess(res, subscription);
  } catch (err) {
    next(err);
  }
};

const revertPendingRenewal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await revertRenewal(decodeId(req.params.id));
    if (!subscription) {
      sendError(res, 'Client has no pending renewal', 404);
      return;
    }
    sendSuccess(res, subscription);
  } catch (err) {
    next(err);
  }
};

const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await deletePendingClient(decodeId(req.params.id), {
      userId: req.user!.userId,
      username: req.user!.username,
    });
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

export default { getPendingPayment, markPaid, revertPendingRenewal, remove };
