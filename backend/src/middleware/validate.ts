import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { sendError } from '../utils/response';

const validate = (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    sendError(res, result.error.issues[0].message, 400);
    return;
  }

  req.body = result.data;
  next();
};

export default validate;
