import { NextFunction, Request, Response } from 'express';
import {
  findAll as findAllClients,
  findById as findClientById,
  create as createClient,
  update as updateClient,
  finalize as finalizeClient,
  softDelete as softDeleteClient,
  search as searchClients,
  setDeliveryGroup,
} from '../domains/client';
import { clientHasAppointment } from '../domains/evaluation';
import { ROLES } from '../constants/roles.constants';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';
import { decodeId } from '../utils/sqids';

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await createClient(req.body);
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
    const { rows, total } = await findAllClients({
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

const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (typeof q !== 'string' || !q) {
      sendSuccess(res, []);
      return;
    }
    const clients = await searchClients(q);
    sendSuccess(res, clients);
  } catch (err) {
    next(err);
  }
};

const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = decodeId(req.params.id);

    // Nutritionist has no client list — she can only reach a client she has an
    // appointment linking her to (see ADR-006), not any arbitrary client id.
    if (req.user!.role === ROLES.NUTRITIONIST) {
      const hasAppointment = await clientHasAppointment(id);
      if (!hasAppointment) {
        sendError(res, 'Acceso denegado', 403);
        return;
      }
    }

    const client = await findClientById(id);
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
    const client = await updateClient(decodeId(req.params.id), req.body, {
      userId: req.user!.userId,
      username: req.user!.username,
    });
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
    const client = await finalizeClient(decodeId(req.params.id), {
      userId: req.user!.userId,
      username: req.user!.username,
    });
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
    const client = await softDeleteClient(decodeId(req.params.id), {
      userId: req.user!.userId,
      username: req.user!.username,
    });
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

const setGroupHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = decodeId(req.params.id);
    const memberIds = (req.body.memberIds as string[]).map(decodeId);
    await setDeliveryGroup(clientId, memberIds);
    const client = await findClientById(clientId);
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  getAll,
  getById,
  update,
  finalize,
  remove,
  setGroup: setGroupHandler,
  search,
};
