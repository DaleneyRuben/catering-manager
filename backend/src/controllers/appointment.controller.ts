import { NextFunction, Request, Response } from 'express';
import * as evaluationService from '../domains/evaluation';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const VALID_HISTORY_STATUS = ['pagado', 'no_pagado'];

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

const getPendingForNutritionist = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await evaluationService.findPendingForNutritionist());
  } catch (err) {
    next(err);
  }
};

const getHistoryForNutritionist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, q, dateFrom, dateTo, page, limit } = req.query;
    const resolvedPage = Math.max(1, page ? Number(page) : 1);
    const resolvedLimit = Math.min(100, Math.max(1, limit ? Number(limit) : 25));
    const resolvedStatus = VALID_HISTORY_STATUS.includes(status as string)
      ? (status as 'pagado' | 'no_pagado')
      : undefined;
    const { rows, total } = await evaluationService.findHistoryForNutritionist({
      status: resolvedStatus,
      q: typeof q === 'string' && q ? q : undefined,
      dateFrom: typeof dateFrom === 'string' && dateFrom ? dateFrom : undefined,
      dateTo: typeof dateTo === 'string' && dateTo ? dateTo : undefined,
      page: resolvedPage,
      limit: resolvedLimit,
    });
    sendPaginated(res, rows, total, resolvedPage, resolvedLimit);
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
  getPendingForNutritionist,
  getHistoryForNutritionist,
  convert,
  resolveRenewal,
};
