import { NextFunction, Request, Response } from 'express';
import {
  createCategory as createFinanceCategory,
  createExpense as createFinanceExpense,
  deactivateCategory,
  deleteExpense as deleteFinanceExpense,
  findCategories,
  findEarliestMonth,
  findMonthSummary,
  findMovements,
  findMovementsSubtotal,
  reactivateCategory,
  renameCategory,
  updateExpense as updateFinanceExpense,
} from '../domains/finance';
import { categoryQuerySchema, monthSchema, movementFiltersSchema } from '../schemas/finance.schema';
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

const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = categoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.issues[0].message, 400);
      return;
    }

    // Only the categories modal asks for the archived ones; the expense form's chip row must not
    // offer a category nobody is supposed to file against any more.
    sendSuccess(
      res,
      await findCategories({
        includeInactive: parsed.data.includeArchived,
        month: parsed.data.month,
      }),
    );
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, created } = await createFinanceCategory(req.body.name);
    // 201 only when something was actually added — a folded name returns the category the user
    // meant, which is what "+ Nueva" needs in order to select it, but nothing was created.
    sendSuccess(res, category, created ? 201 : 200);
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = decodeId(req.params.id);
    const { name, active } = req.body;

    // The rename runs first so a category being renamed and restored in one request is not left
    // active under its old name if the new one turns out to be taken.
    let category = name === undefined ? null : await renameCategory(id, name);
    if (name !== undefined && !category) {
      sendError(res, 'Category not found', 404);
      return;
    }

    if (active !== undefined) {
      category = active ? await reactivateCategory(id) : await deactivateCategory(id);
    }

    if (!category) {
      sendError(res, 'Category not found', 404);
      return;
    }

    sendSuccess(res, category);
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

export default {
  getOverview,
  getCategories,
  createCategory,
  updateCategory,
  createExpense,
  updateExpense,
  removeExpense,
};
