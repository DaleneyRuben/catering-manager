import { NextFunction, Request, Response } from 'express';
import {
  findAll as planFindAll,
  findById as planFindById,
  getClientCounts as planGetClientCounts,
  create as planCreate,
  update as planUpdate,
  remove as planRemove,
} from '../services/plan';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await planFindAll();
    sendSuccess(res, plans);
  } catch (err) {
    next(err);
  }
};

const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await planFindById(decodeId(req.params.id));
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
    const plan = await planCreate(req.body);
    sendSuccess(res, plan, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await planUpdate(decodeId(req.params.id), req.body);
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
    const deleted = await planRemove(decodeId(req.params.id));
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
    const counts = await planGetClientCounts();
    sendSuccess(res, counts);
  } catch (err) {
    next(err);
  }
};

export default { getAll, getById, create, update, remove, getClientCounts };
