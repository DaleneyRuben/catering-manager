import { NextFunction, Request, Response } from 'express';
import clientService from '../services/client.service';
import deliveryGroupService from '../services/deliveryGroup.service';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientService.create(req.body);
    sendSuccess(res, client, 201);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, q, birthMonth, page, limit } = req.query;
    const resolvedPage = Math.max(1, page ? Number(page) : 1);
    const resolvedLimit = Math.min(100, Math.max(1, limit ? Number(limit) : 25));
    const { rows, total } = await clientService.findAll({
      status: typeof status === 'string' ? status : undefined,
      q: typeof q === 'string' && q ? q : undefined,
      birthMonth: birthMonth ? Number(birthMonth) : undefined,
      page: resolvedPage,
      limit: resolvedLimit,
    });
    sendPaginated(res, rows, total, resolvedPage, resolvedLimit);
  } catch (err) {
    next(err);
  }
};

const getCounts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const counts = await clientService.getCounts();
    sendSuccess(res, counts);
  } catch (err) {
    next(err);
  }
};

const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientService.findById(decodeId(req.params.id));
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientService.update(decodeId(req.params.id), req.body);
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

const finalize = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientService.finalize(decodeId(req.params.id));
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientService.softDelete(decodeId(req.params.id));
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

const setGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = decodeId(req.params.id);
    const memberIds = (req.body.memberIds as string[]).map(decodeId);
    await deliveryGroupService.setGroup(clientId, memberIds);
    const client = await clientService.findById(clientId);
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

export default { create, getAll, getCounts, getById, update, finalize, remove, setGroup };
