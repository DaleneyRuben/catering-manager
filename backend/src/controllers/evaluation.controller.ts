import { NextFunction, Request, Response } from 'express';
import * as evaluationService from '../domains/evaluation';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const getPendingPayment = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await evaluationService.findPendingPayment());
  } catch (err) {
    next(err);
  }
};

const markPaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await evaluationService.markPaid(decodeId(req.params.id), {
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
    const subscription = await evaluationService.revertPendingRenewal(decodeId(req.params.id));
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
    const client = await evaluationService.deletePendingClient(decodeId(req.params.id), {
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
