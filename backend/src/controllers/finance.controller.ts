import { NextFunction, Request, Response } from 'express';
import {
  createExpense as createFinanceExpense,
  deleteExpense as deleteFinanceExpense,
  findCategories,
  findEarliestMonth,
  findMonthSummary,
  findMovements,
  findMovementsSubtotal,
  updateExpense as updateFinanceExpense,
} from '../domains/finance';
import { monthSchema, movementFiltersSchema } from '../schemas/finance.schema';
import { appToday } from '../utils/date';
import { sendError, sendSuccess } from '../utils/response';
import { decodeId } from '../utils/sqids';

const currentMonth = () => appToday().slice(0, 7);

const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month: requested } = req.query;
    const month = requested === undefined ? currentMonth() : requested;

    const parsed = monthSchema.safeParse(month);
    if (!parsed.success) {
      sendError(res, parsed.error.issues[0].message, 400);
      return;
    }

    const filters = movementFiltersSchema.safeParse(req.query);
    if (!filters.success) {
      sendError(res, filters.error.issues[0].message, 400);
      return;
    }

    // The three tiles are the month's truth and never see the filters — a "Balance" of one
    // category is not a balance of anything. Only the list and its subtotal narrow.
    const [summary, movements, subtotal, earliest] = await Promise.all([
      findMonthSummary(parsed.data),
      findMovements(parsed.data, filters.data),
      findMovementsSubtotal(parsed.data, filters.data),
      findEarliestMonth(),
    ]);

    // An empty register has nothing to page back to, so the current month is its own floor.
    sendSuccess(res, {
      month: parsed.data,
      earliestMonth: earliest ?? currentMonth(),
      ...summary,
      movements,
      ...subtotal,
    });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await findCategories());
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await createFinanceExpense(req.body, {
      userId: req.user!.userId,
      username: req.user!.username,
    });
    sendSuccess(res, expense, 201);
  } catch (err) {
    next(err);
  }
};

const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await updateFinanceExpense(decodeId(req.params.id), req.body);
    if (!expense) {
      sendError(res, 'Expense not found', 404);
      return;
    }
    sendSuccess(res, expense);
  } catch (err) {
    next(err);
  }
};

const removeExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await deleteFinanceExpense(decodeId(req.params.id));
    if (!deleted) {
      sendError(res, 'Expense not found', 404);
      return;
    }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};

export default { getOverview, getCategories, createExpense, updateExpense, removeExpense };
