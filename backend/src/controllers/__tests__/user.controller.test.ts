import request from 'supertest';
import app from '../../app';
import * as userService from '../../services/user';
import * as loginEventService from '../../services/login-event';
import { encodeId } from '../../utils/sqids';
import { ROLES } from '../../constants/roles.constants';

jest.mock('../../services/user');
jest.mock('../../services/login-event');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockFindAll = userService.findAll as jest.Mock;
const mockCreate = userService.create as jest.Mock;
const mockUpdate = userService.update as jest.Mock;
const mockRemove = userService.remove as jest.Mock;

const id1 = encodeId(1);
const id999 = encodeId(999);

const mockUser = { id: 1, username: 'ada', role: ROLES.KITCHEN };

beforeEach(() => jest.clearAllMocks());

describe('GET /api/users', () => {
  it('returns all users', async () => {
    mockFindAll.mockResolvedValue([mockUser]);

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ username: 'ada', role: 'kitchen' });
  });

  it('returns 500 when service throws', async () => {
    mockFindAll.mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(500);
  });
});

describe('POST /api/users', () => {
  const validPayload = { username: 'grace', password: 'secret123', role: ROLES.KITCHEN };

  it('creates a user and returns 201', async () => {
    mockCreate.mockResolvedValue({ id: 2, username: 'grace', role: ROLES.KITCHEN });

    const res = await request(app).post('/api/users').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ username: 'grace', role: ROLES.KITCHEN });
    expect(mockCreate).toHaveBeenCalledWith(validPayload);
  });

  it('returns 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ password: 'secret123', role: ROLES.KITCHEN });

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'grace', password: '123', role: ROLES.KITCHEN });

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when role is invalid', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'grace', password: 'secret123', role: 'superuser' });

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when role is the retired manager role', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'grace', password: 'secret123', role: 'manager' });

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 500 when service throws', async () => {
    mockCreate.mockRejectedValue(new Error('db error'));

    const res = await request(app).post('/api/users').send(validPayload);

    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/users/:id', () => {
  it('updates a user and returns 200', async () => {
    mockUpdate.mockResolvedValue({ id: 1, username: 'ada2', role: ROLES.ADMIN });

    const res = await request(app)
      .patch(`/api/users/${id1}`)
      .send({ username: 'ada2', role: ROLES.ADMIN });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ username: 'ada2', role: ROLES.ADMIN });
    expect(mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ username: 'ada2' }));
  });

  it('returns 404 when user not found', async () => {
    mockUpdate.mockResolvedValue(null);

    const res = await request(app).patch(`/api/users/${id999}`).send({ username: 'ghost' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).patch(`/api/users/${id1}`).send({ password: '123' });

    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when role is invalid', async () => {
    const res = await request(app).patch(`/api/users/${id1}`).send({ role: 'superuser' });

    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 500 when service throws', async () => {
    mockUpdate.mockRejectedValue(new Error('db error'));

    const res = await request(app).patch(`/api/users/${id1}`).send({ username: 'ada2' });

    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/users/:id', () => {
  it('deletes a user and returns 204', async () => {
    mockRemove.mockResolvedValue(true);

    const res = await request(app).delete(`/api/users/${id1}`);

    expect(res.status).toBe(204);
    expect(mockRemove).toHaveBeenCalledWith(1);
  });

  it('returns 404 when user not found', async () => {
    mockRemove.mockResolvedValue(false);

    const res = await request(app).delete(`/api/users/${id999}`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    mockRemove.mockRejectedValue(new Error('db error'));

    const res = await request(app).delete(`/api/users/${id1}`);

    expect(res.status).toBe(500);
  });
});

describe('GET /api/users/:id/logins', () => {
  const mockFindForUser = loginEventService.findForUser as jest.Mock;

  it('returns the login history for the user', async () => {
    const entries = [
      {
        deviceType: 'mobile',
        os: 'Android 14',
        browser: 'Chrome 126',
        createdAt: '2026-07-03T12:30:00.000Z',
      },
    ];
    mockFindForUser.mockResolvedValue(entries);

    const res = await request(app).get(`/api/users/${id1}/logins`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(entries);
    expect(mockFindForUser).toHaveBeenCalledWith(1);
  });

  it('returns an empty list when the user has no logins', async () => {
    mockFindForUser.mockResolvedValue([]);

    const res = await request(app).get(`/api/users/${id999}/logins`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 500 when service throws', async () => {
    mockFindForUser.mockRejectedValue(new Error('db error'));

    const res = await request(app).get(`/api/users/${id1}/logins`);

    expect(res.status).toBe(500);
  });
});
