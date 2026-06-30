import { NextFunction, Request, Response } from 'express';
import planQueryService from '../services/plan/queries.service';
import planMutationService from '../services/plan/mutations.service';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await planQueryService.findAll();
    sendSuccess(res, plans);
  } catch (err) {
    next(err);
  }
};

const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await planQueryService.findById(decodeId(req.params.id));
    if (!plan) {
      sendError(res, 'Plan not found', 404);
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    next(err);
  }
};

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await planMutationService.create(req.body);
    sendSuccess(res, plan, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await planMutationService.update(decodeId(req.params.id), req.body);
    if (!plan) {
      sendError(res, 'Plan not found', 404);
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    next(err);
  }
};

const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await planMutationService.remove(decodeId(req.params.id));
    if (!deleted) {
      sendError(res, 'Plan not found', 404);
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

const getClientCounts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const counts = await planQueryService.getClientCounts();
    sendSuccess(res, counts);
  } catch (err) {
    next(err);
  }
};

export default { getAll, getById, create, update, remove, getClientCounts };
