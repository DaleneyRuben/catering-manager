import { NextFunction, Request, Response } from 'express';
import clientQueryService from '../services/client/queries.service';
import clientMutationService from '../services/client/mutations.service';
import deliveryGroupService from '../services/delivery/group.service';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientMutationService.create(req.body);
    sendSuccess(res, client, 201);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, q, restriction, page, limit } = req.query;
    const resolvedPage = Math.max(1, page ? Number(page) : 1);
    const resolvedLimit = Math.min(100, Math.max(1, limit ? Number(limit) : 25));
    const { rows, total } = await clientQueryService.findAll({
      status: typeof status === 'string' ? status : undefined,
      q: typeof q === 'string' && q ? q : undefined,
      restriction: typeof restriction === 'string' && restriction ? restriction : undefined,
      page: resolvedPage,
      limit: resolvedLimit,
    });
    sendPaginated(res, rows, total, resolvedPage, resolvedLimit);
  } catch (err) {
    next(err);
  }
};

const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientQueryService.findById(decodeId(req.params.id));
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
    const client = await clientMutationService.update(decodeId(req.params.id), req.body);
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
    const client = await clientMutationService.finalize(decodeId(req.params.id));
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
    const client = await clientMutationService.softDelete(decodeId(req.params.id));
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
    const client = await clientQueryService.findById(clientId);
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

export default { create, getAll, getById, update, finalize, remove, setGroup };
