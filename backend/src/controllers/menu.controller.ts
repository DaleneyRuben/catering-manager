import { NextFunction, Request, Response } from 'express';
import {
  findAll as findAllMenus,
  findByDate as findMenuByDate,
  upsert as upsertMenu,
} from '../domains/menu';
import { sendError, sendSuccess } from '../utils/response';

const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const menus = await findAllMenus();
    sendSuccess(res, menus);
  } catch (err) {
    next(err);
  }
};

const getByDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const menu = await findMenuByDate(req.params.date);
    if (!menu) {
      sendError(res, 'Menu not found', 404);
      return;
    }
    sendSuccess(res, menu);
  } catch (err) {
    next(err);
  }
};

const upsert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, ...data } = req.body;
    const menu = await upsertMenu(date, data);
    sendSuccess(res, menu);
  } catch (err) {
    next(err);
  }
};

export default { getAll, getByDate, upsert };
