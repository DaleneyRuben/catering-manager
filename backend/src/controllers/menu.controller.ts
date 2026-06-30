import { NextFunction, Request, Response } from 'express';
import { findAll as menuFindAll, findByDate, upsert as menuUpsert } from '../services/menu';
import { sendError, sendSuccess } from '../utils/response';

const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const menus = await menuFindAll();
    sendSuccess(res, menus);
  } catch (err) {
    next(err);
  }
};

const getByDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const menu = await findByDate(req.params.date);
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
    const menu = await menuUpsert(date, data);
    sendSuccess(res, menu);
  } catch (err) {
    next(err);
  }
};

export default { getAll, getByDate, upsert };
