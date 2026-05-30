import { NextFunction, Request, Response } from 'express';
import ClientHistory from '../models/ClientHistory';
import { sendSuccess, sendError } from '../utils/response';

const getByClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = Number(req.params.id);
    const history = await ClientHistory.findAll({
      where: { clientId },
      order: [['occurredAt', 'DESC']],
    });
    if (!history) {
      sendError(res, 'Client not found', 404);
      return;
    }
    sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
};

export default { getByClient };
