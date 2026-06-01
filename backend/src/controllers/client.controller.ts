import { NextFunction, Request, Response } from 'express';
import clientService from '../services/client.service';
import { sendSuccess, sendError } from '../utils/response';

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
    const { status, q, birthMonth } = req.query;
    const clients = await clientService.findAll({
      status: typeof status === 'string' ? status : undefined,
      q: typeof q === 'string' && q ? q : undefined,
      birthMonth: birthMonth ? Number(birthMonth) : undefined,
    });
    sendSuccess(res, clients);
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
    const client = await clientService.findById(Number(req.params.id));
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
    const client = await clientService.update(Number(req.params.id), req.body);
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
};

export default { create, getAll, getCounts, getById, update };
