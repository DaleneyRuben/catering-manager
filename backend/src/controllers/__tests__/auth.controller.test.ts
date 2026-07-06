import request from 'supertest';
import app from '../../app';
import * as authService from '../../services/auth';
import { InvalidCredentialsError } from '../../services/auth';

jest.mock('../../services/auth');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const mockLogin = authService.login as jest.Mock;

const loginResponse = {
  token: 'signed-token',
  user: { id: 1, username: 'ada', role: 'admin' },
};

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns token and user on valid credentials', async () => {
    mockLogin.mockResolvedValue(loginResponse);

    const res = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent/1.0')
      .send({ username: 'ada', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(loginResponse);
    expect(mockLogin).toHaveBeenCalledWith('ada', 'secret123', 'test-agent/1.0');
  });

  it('returns 400 when username is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Usuario y contraseña son requeridos' });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'ada' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Usuario y contraseña son requeridos' });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Usuario y contraseña son requeridos' });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('returns 401 on invalid credentials', async () => {
    mockLogin.mockRejectedValue(new InvalidCredentialsError());

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ada', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Credenciales inválidas' });
  });

  it('forwards unexpected errors to error handler', async () => {
    mockLogin.mockRejectedValue(new Error('db connection failed'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ada', password: 'secret123' });

    expect(res.status).toBe(500);
  });
});
