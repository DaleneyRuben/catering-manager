import { Request, Response, NextFunction } from 'express';
import errorHandler from '../error-handler';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn() as unknown as NextFunction;
const mockReq = () => ({}) as Request;

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
});
