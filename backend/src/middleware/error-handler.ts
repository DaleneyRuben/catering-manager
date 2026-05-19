import { NextFunction, Request, Response } from 'express';

interface AppError extends Error {
  statusCode?: number;
}

function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({ message: err.message || 'internal server error' });
}

export default errorHandler;
