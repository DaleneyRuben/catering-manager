import { NextFunction, Request, Response } from 'express';
import { parseISO } from 'date-fns';
import * as productionService from '../services/production';
import { addCalendarDays, getCurrentMenuWeek, isIsoDate } from '../utils/date';
import { checkIsWeekend } from '../utils/devFlags';
import { sendSuccess } from '../utils/response';

const MAX_WEEK_OFFSET = 2;

const getGroups = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [summary, weeklyCounts] = await Promise.all([
      productionService.findGroups(),
      productionService.findWeeklyCounts(),
    ]);
    sendSuccess(res, { ...summary, weeklyCounts });
  } catch (err) {
    next(err);
  }
};

const getWeeklyCounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { offset } = req.query;

    if (typeof offset !== 'string' || !/^\d+$/.test(offset) || Number(offset) > MAX_WEEK_OFFSET) {
      res.status(400).json({ error: `offset param is required and must be 0-${MAX_WEEK_OFFSET}` });
      return;
    }

    sendSuccess(res, await productionService.findWeeklyCounts(Number(offset)));
  } catch (err) {
    next(err);
  }
};

const getDayClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;

    if (typeof date !== 'string' || !isIsoDate(date)) {
      res.status(400).json({ error: 'date param is required and must be YYYY-MM-DD' });
      return;
    }

    if (checkIsWeekend(parseISO(date))) {
      res.status(400).json({ error: 'No hay entregas los fines de semana' });
      return;
    }

    const { start } = getCurrentMenuWeek();
    const windowEnd = addCalendarDays(start, MAX_WEEK_OFFSET * 7 + 4);
    if (date < start || date > windowEnd) {
      res.status(400).json({ error: 'La fecha está fuera del rango consultable' });
      return;
    }

    sendSuccess(res, await productionService.findDayClients(date));
  } catch (err) {
    next(err);
  }
};

export default { getGroups, getWeeklyCounts, getDayClients };
