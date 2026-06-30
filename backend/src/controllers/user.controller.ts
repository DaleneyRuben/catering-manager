import { NextFunction, Request, Response } from 'express';
import {
  findAll as userFindAll,
  create as userCreate,
  update as userUpdate,
  remove as userRemove,
} from '../services/user';
import { sendSuccess, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userFindAll();
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
};

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userCreate(req.body);
    sendSuccess(res, { id: user.id, username: user.username, role: user.role }, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userUpdate(decodeId(req.params.id), req.body);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await userRemove(decodeId(req.params.id));
    if (!deleted) {
      sendError(res, 'User not found', 404);
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export default { getAll, create, update, remove };
