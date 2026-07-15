import { NextFunction, Request, Response } from 'express';
import { parseISO } from 'date-fns';
import * as productionService from '../services/production';
import { MAX_WEEK_OFFSET } from '../constants/production.constants';
import { addCalendarDays, getCurrentMenuWeek, isIsoDate } from '../utils/date';
import { checkIsWeekend } from '../utils/devFlags';
import { sendSuccess } from '../utils/response';

// The Mondays admins may query: current display week plus MAX_WEEK_OFFSET weeks forward.
const navigableWeekStarts = (): string[] => {
  const { start } = getCurrentMenuWeek();
  return Array.from({ length: MAX_WEEK_OFFSET + 1 }, (_, i) => addCalendarDays(start, i * 7));
};

const getOverview = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [summary, weeklyCounts] = await Promise.all([
      productionService.findGroups(),
      productionService.findWeeklyCounts(),
    ]);
    sendSuccess(res, { ...summary, weeklyCounts, weekStarts: navigableWeekStarts() });
  } catch (err) {
    next(err);
  }
};

const getWeeklyCounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekStart } = req.query;

    if (typeof weekStart !== 'string' || !navigableWeekStarts().includes(weekStart)) {
      res
        .status(400)
        .json({ error: 'weekStart param is required and must be a navigable week monday' });
      return;
    }

    sendSuccess(res, await productionService.findWeeklyCounts(weekStart));
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

    const weekStarts = navigableWeekStarts();
    const windowEnd = addCalendarDays(weekStarts[weekStarts.length - 1], 4);
    if (date < weekStarts[0] || date > windowEnd) {
      res.status(400).json({ error: 'La fecha está fuera del rango consultable' });
      return;
    }

    sendSuccess(res, await productionService.findDayClients(date));
  } catch (err) {
    next(err);
  }
};

export default { getOverview, getWeeklyCounts, getDayClients };
