import { NextFunction, Request, Response } from 'express';
import clientService from '../services/client.service';
import { sendSuccess } from '../utils/response';

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientService.create(req.body);
    sendSuccess(res, client, 201);
  } catch (err) {
    next(err);
  }
};

export default { create };
