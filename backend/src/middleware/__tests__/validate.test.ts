import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import validate from '../validate';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn() as unknown as NextFunction;
const makeReq = (body: unknown): Request => ({ body }) as Request;

const schema = z.object({ name: z.string().min(1, 'name is required') });

describe('validate', () => {
  it('calls next with the parsed body when validation passes', () => {
    const req = makeReq({ name: 'Ana' });
    const res = mockRes();
    const next = mockNext();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Ana' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds 400 with the first issue message when validation fails', () => {
    const req = makeReq({ name: '' });
    const res = mockRes();
    const next = mockNext();

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'name is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('does not call next when validation fails', () => {
    const req = makeReq({});
    const res = mockRes();
    const next = mockNext();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});
