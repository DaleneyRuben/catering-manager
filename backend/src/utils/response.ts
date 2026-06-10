import { Response } from 'express';
import { encodeIds } from './sqids';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) =>
  res.status(statusCode).json({ data: encodeIds(data) });

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
) => res.status(200).json({ data: encodeIds(data), total, page, limit });

export const sendError = (res: Response, message: string, statusCode = 500) =>
  res.status(statusCode).json({ message });
