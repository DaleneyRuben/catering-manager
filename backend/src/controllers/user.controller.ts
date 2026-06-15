import { NextFunction, Request, Response } from 'express';
import userService from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';

const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.findAll();
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
};

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.create(req.body);
    sendSuccess(res, { id: user.id, username: user.username, role: user.role }, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.update(Number(req.params.id), req.body);
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
    const deleted = await userService.remove(Number(req.params.id));
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
