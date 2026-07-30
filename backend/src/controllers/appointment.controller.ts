import { NextFunction, Request, Response } from 'express';
import * as evaluationService from '../services/evaluation';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, ...rest } = req.body;
    const appointment = await evaluationService.createAppointment({
      ...rest,
      ...(clientId !== undefined ? { clientId: decodeId(clientId) } : {}),
    });
    if (!appointment) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, appointment, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionId, ...rest } = req.body;
    const appointment = await evaluationService.updateAppointment(decodeId(req.params.id), {
      ...rest,
      ...(subscriptionId !== undefined ? { subscriptionId: decodeId(subscriptionId) } : {}),
    });
    if (!appointment) {
      sendError(res, 'Appointment not found', 404);
      return;
    }
    sendSuccess(res, appointment);
  } catch (err) {
    next(err);
  }
};

const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await evaluationService.cancelAppointment(decodeId(req.params.id));
    if (!appointment) {
      sendError(res, 'Appointment not found', 404);
      return;
    }
    sendSuccess(res, appointment);
  } catch (err) {
    next(err);
  }
};

const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await evaluationService.findById(decodeId(req.params.id));
    if (!appointment) {
      sendError(res, 'Appointment not found', 404);
      return;
    }
    sendSuccess(res, appointment);
  } catch (err) {
    next(err);
  }
};

const getPending = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await evaluationService.findPendingForAdmin());
  } catch (err) {
    next(err);
  }
};

const getForNutritionist = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await evaluationService.findForNutritionist());
  } catch (err) {
    next(err);
  }
};

const convert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await evaluationService.convertAppointment(
      decodeId(req.params.id),
      req.body.client,
      req.body.subscription,
      { userId: req.user!.userId, username: req.user!.username },
    );
    if (!result) {
      sendError(res, 'Appointment not found or already converted', 404);
      return;
    }
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const resolveRenewal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await evaluationService.resolveRenewal(decodeId(req.params.id), req.body, {
      userId: req.user!.userId,
      username: req.user!.username,
    });
    if (!result) {
      sendError(res, 'Appointment not found or already resolved', 404);
      return;
    }
    if (!result.subscription) {
      sendError(res, 'Client already has a pending unpaid renewal', 409);
      return;
    }
    sendSuccess(res, result.subscription, 201);
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  update,
  remove,
  getById,
  getPending,
  getForNutritionist,
  convert,
  resolveRenewal,
};
