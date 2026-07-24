import { NextFunction, Request, Response } from 'express';
import * as evaluationService from '../services/evaluation';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await evaluationService.createAppointment(req.body);
    sendSuccess(res, appointment, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await evaluationService.updateAppointment(
      decodeId(req.params.id),
      req.body,
    );
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

export default { create, update, remove, getPending, getForNutritionist, convert };
