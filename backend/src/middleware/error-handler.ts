import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';
import { captureError } from '../utils/sentry';

interface AppError extends Error {
  statusCode?: number;
}

async function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode ?? 500;
  const context = { err, method: req.method, path: req.originalUrl, statusCode };

  if (statusCode >= 500) {
    logger.error(context, err.message || 'internal server error');
    // 4xx are expected client errors — only unexpected failures go to sentry
    await captureError(err);
  } else {
    logger.warn(context, err.message || 'internal server error');
  }

  res.status(statusCode).json({ message: err.message || 'internal server error' });
}

export default errorHandler;
