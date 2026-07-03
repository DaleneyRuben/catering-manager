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

  it('allows requests from vercel preview deployments', async () => {
    const previewOrigin =
      'https://la-oliva-frontend-9pfvrvpti-fernando-daleney-s-projects.vercel.app';

    const res = await request(app)
      .options('/api/health')
      .set('Origin', previewOrigin)
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe(previewOrigin);
  });

  it('allows requests from vercel git branch alias deployments', async () => {
    const branchOrigin =
      'https://la-oliva-frontend-git-fix-ve-badeeb-fernando-daleney-s-projects.vercel.app';

    const res = await request(app)
      .options('/api/health')
      .set('Origin', branchOrigin)
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe(branchOrigin);
  });

  it('rejects requests from unrelated origins', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects lookalike domains that embed the preview hostname', async () => {
    const res = await request(app)
      .options('/api/health')
      .set(
        'Origin',
        'https://la-oliva-frontend-9pfvrvpti-fernando-daleney-s-projects.vercel.app.evil.com',
      )
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
