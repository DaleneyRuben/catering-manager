import request from 'supertest';
import app from './app';

jest.mock('./database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

describe('GET /api/health', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(401);
  });
});

describe('CORS', () => {
  it('allows requests from the configured origin', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});
