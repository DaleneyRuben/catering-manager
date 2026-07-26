import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../services/auth';
import { ROLES } from '../../constants/roles.constants';
import * as evaluationService from '../../services/evaluation';

jest.mock('../../services/auth');
jest.mock('../../services/evaluation');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const mockVerifyToken = verifyToken as jest.Mock;

const headersForRole = (role: string) => {
  mockVerifyToken.mockReturnValue({ userId: 1, role });
  return { Authorization: 'Bearer test-token' };
};

beforeEach(() => {
  jest.clearAllMocks();
  (evaluationService.findPendingForAdmin as jest.Mock).mockResolvedValue([]);
  (evaluationService.findForNutritionist as jest.Mock).mockResolvedValue([]);
});

describe('GET /api/appointments/pending role guard', () => {
  it('allows super_admin', async () => {
    const res = await request(app)
      .get('/api/appointments/pending')
      .set(headersForRole(ROLES.SUPER_ADMIN));

    expect(res.status).toBe(200);
  });

  it('allows admin', async () => {
    const res = await request(app)
      .get('/api/appointments/pending')
      .set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(200);
  });

  it('rejects nutritionist with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/pending')
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });

  it('rejects kitchen with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/pending')
      .set(headersForRole(ROLES.KITCHEN));

    expect(res.status).toBe(403);
  });

  it('rejects requests with no token with 401', async () => {
    const res = await request(app).get('/api/appointments/pending');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/appointments/nutritionist role guard', () => {
  it('allows nutritionist', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist')
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(200);
  });

  it('rejects admin with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist')
      .set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(403);
  });

  it('rejects super_admin with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist')
      .set(headersForRole(ROLES.SUPER_ADMIN));

    expect(res.status).toBe(403);
  });
});

describe('admin-only appointment mutation routes role guard', () => {
  const cases = [
    { method: 'post' as const, path: '/api/appointments' },
    { method: 'patch' as const, path: '/api/appointments/abc123' },
    { method: 'delete' as const, path: '/api/appointments/abc123' },
  ];

  it.each(cases)('rejects nutritionist on $method $path with 403', async ({ method, path }) => {
    const res = await request(app)[method](path).set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });
});

describe('GET /api/appointments/:id role guard', () => {
  it('allows nutritionist', async () => {
    (evaluationService.findById as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await request(app)
      .get('/api/appointments/abc123')
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(200);
  });

  it('allows admin', async () => {
    (evaluationService.findById as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await request(app).get('/api/appointments/abc123').set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(200);
  });

  it('rejects kitchen with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/abc123')
      .set(headersForRole(ROLES.KITCHEN));

    expect(res.status).toBe(403);
  });
});

describe('nutritionist-only convert route role guard', () => {
  it('rejects admin with 403', async () => {
    const res = await request(app)
      .post('/api/appointments/abc123/convert')
      .set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(403);
  });

  it('rejects super_admin with 403', async () => {
    const res = await request(app)
      .post('/api/appointments/abc123/convert')
      .set(headersForRole(ROLES.SUPER_ADMIN));

    expect(res.status).toBe(403);
  });
});
