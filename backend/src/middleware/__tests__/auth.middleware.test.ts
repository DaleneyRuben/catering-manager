import { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../auth';
import authService from '../../services/auth.service';

jest.mock('../../services/auth.service');

const mockVerifyToken = authService.verifyToken as jest.Mock;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn() as unknown as NextFunction;

const makeReq = (authorization?: string): Request =>
  ({ headers: { authorization } }) as unknown as Request;

describe('requireAuth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next when token is valid', () => {
    const payload = { userId: 1, role: 'admin' as const };
    mockVerifyToken.mockReturnValue(payload);
    const req = makeReq('Bearer valid-token');
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is missing', () => {
    const req = makeReq(undefined);
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autorizado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req = makeReq('Basic abc123');
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autorizado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });
    const req = makeReq('Bearer bad-token');
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeAuthedReq = (role: 'admin' | 'manager' | 'delivery'): Request =>
    ({ headers: {}, user: { userId: 1, role } }) as unknown as Request;

  it('calls next when user has an allowed role', () => {
    const req = makeAuthedReq('admin');
    const res = mockRes();
    const next = mockNext();

    requireRole('admin', 'manager')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is not in allowed list', () => {
    const req = makeAuthedReq('delivery');
    const res = mockRes();
    const next = mockNext();

    requireRole('admin', 'manager')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso denegado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is not set', () => {
    const req = { headers: {} } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    requireRole('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso denegado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows manager when manager is in the allowed roles', () => {
    const req = makeAuthedReq('manager');
    const res = mockRes();
    const next = mockNext();

    requireRole('admin', 'manager')(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
