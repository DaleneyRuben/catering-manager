import { NextFunction, Request, Response } from 'express';
import menuService from '../services/menu/menu.service';
import { sendError, sendSuccess } from '../utils/response';

const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const menus = await menuService.findAll();
    sendSuccess(res, menus);
  } catch (err) {
    next(err);
  }
};

const getByDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const menu = await menuService.findByDate(req.params.date);
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
    const menu = await menuService.upsert(date, data);
    sendSuccess(res, menu);
  } catch (err) {
    next(err);
  }
};

export default { getAll, getByDate, upsert };
