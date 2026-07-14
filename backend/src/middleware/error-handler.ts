import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
}

function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode ?? 500;
  const context = { err, method: req.method, path: req.originalUrl, statusCode };

  if (statusCode >= 500) {
    logger.error(context, err.message || 'internal server error');
  } else {
    logger.warn(context, err.message || 'internal server error');
  }

  res.status(statusCode).json({ message: err.message || 'internal server error' });
}

export default errorHandler;
