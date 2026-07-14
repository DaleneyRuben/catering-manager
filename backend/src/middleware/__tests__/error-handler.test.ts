import { Request, Response, NextFunction } from 'express';
import errorHandler from '../error-handler';
import logger from '../../utils/logger';

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn() },
}));

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn() as unknown as NextFunction;
const mockReq = () => ({ method: 'GET', originalUrl: '/api/clients' }) as Request;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('errorHandler', () => {
  it('responds with the error statusCode and message when set', () => {
    const err = Object.assign(new Error('plan not found'), { statusCode: 404 });
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'plan not found' });
  });

  it('defaults to 500 when statusCode is not set', () => {
    const err = new Error('unexpected failure');
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'unexpected failure' });
  });

  it('falls back to a generic message when the error has none', () => {
    const err = Object.assign(new Error(), { message: '' });
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext());

    expect(res.json).toHaveBeenCalledWith({ message: 'internal server error' });
  });

  it('logs 5xx errors at error level with the error and request context', () => {
    const err = new Error('db exploded');

    errorHandler(err, mockReq(), mockRes(), mockNext());

    expect(logger.error).toHaveBeenCalledWith(
      { err, method: 'GET', path: '/api/clients', statusCode: 500 },
      'db exploded',
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs 4xx errors at warn level with the error and request context', () => {
    const err = Object.assign(new Error('plan not found'), { statusCode: 404 });

    errorHandler(err, mockReq(), mockRes(), mockNext());

    expect(logger.warn).toHaveBeenCalledWith(
      { err, method: 'GET', path: '/api/clients', statusCode: 404 },
      'plan not found',
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});
