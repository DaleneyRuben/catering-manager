import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../domains/auth';
import { ROLES } from '../../constants/roles.constants';
import {
  findById,
  findHistoryForNutritionist,
  findPendingForAdmin,
  findPendingForNutritionist,
  resolveRenewal,
  updateAppointment,
} from '../../domains/evaluation';

jest.mock('../../domains/auth');
jest.mock('../../domains/evaluation');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const mockVerifyToken = verifyToken as jest.Mock;

const headersForRole = (role: string) => {
  mockVerifyToken.mockReturnValue({ userId: 1, role });
  return { Authorization: 'Bearer test-token' };
};

beforeEach(() => {
  jest.clearAllMocks();
  (findPendingForAdmin as jest.Mock).mockResolvedValue([]);
  (findPendingForNutritionist as jest.Mock).mockResolvedValue([]);
  (findHistoryForNutritionist as jest.Mock).mockResolvedValue({
    rows: [],
    total: 0,
  });
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

describe('GET /api/appointments/nutritionist/pending role guard', () => {
  it('allows nutritionist', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist/pending')
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(200);
  });

  it('rejects admin with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist/pending')
      .set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(403);
  });

  it('rejects super_admin with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist/pending')
      .set(headersForRole(ROLES.SUPER_ADMIN));

    expect(res.status).toBe(403);
  });
});

describe('GET /api/appointments/nutritionist/history role guard', () => {
  it('allows nutritionist', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist/history')
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(200);
  });

  it('rejects admin with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist/history')
      .set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(403);
  });

  it('rejects super_admin with 403', async () => {
    const res = await request(app)
      .get('/api/appointments/nutritionist/history')
      .set(headersForRole(ROLES.SUPER_ADMIN));

    expect(res.status).toBe(403);
  });
});

describe('admin-only appointment mutation routes role guard', () => {
  const cases = [
    { method: 'post' as const, path: '/api/appointments' },
    { method: 'delete' as const, path: '/api/appointments/abc123' },
  ];

  it.each(cases)('rejects nutritionist on $method $path with 403', async ({ method, path }) => {
    const res = await request(app)[method](path).set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/appointments/:id role guard', () => {
  it('rejects nutritionist with 403 (stamping now happens via resolve-renewal)', async () => {
    const res = await request(app)
      .patch('/api/appointments/abc123')
      .set(headersForRole(ROLES.NUTRITIONIST))
      .send({});

    expect(res.status).toBe(403);
  });

  it('allows admin', async () => {
    (updateAppointment as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await request(app)
      .patch('/api/appointments/abc123')
      .set(headersForRole(ROLES.ADMIN))
      .send({});

    expect(res.status).toBe(200);
  });

  it('rejects kitchen with 403', async () => {
    const res = await request(app)
      .patch('/api/appointments/abc123')
      .set(headersForRole(ROLES.KITCHEN))
      .send({});

    expect(res.status).toBe(403);
  });
});

describe('GET /api/appointments/:id role guard', () => {
  it('allows nutritionist', async () => {
    (findById as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await request(app)
      .get('/api/appointments/abc123')
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(200);
  });

  it('allows admin', async () => {
    (findById as jest.Mock).mockResolvedValue({ id: 1 });

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

describe('nutritionist-only resolve-renewal route role guard', () => {
  it('allows nutritionist', async () => {
    (resolveRenewal as jest.Mock).mockResolvedValue({ subscription: { id: 1 } });

    const res = await request(app)
      .post('/api/appointments/abc123/resolve-renewal')
      .set(headersForRole(ROLES.NUTRITIONIST))
      .send({ planId: 'abc', contractDate: '2026-07-24', duration: 20 });

    expect(res.status).toBe(201);
  });

  it('rejects admin with 403', async () => {
    const res = await request(app)
      .post('/api/appointments/abc123/resolve-renewal')
      .set(headersForRole(ROLES.ADMIN))
      .send({ planId: 'abc', contractDate: '2026-07-24', duration: 20 });

    expect(res.status).toBe(403);
  });

  it('rejects super_admin with 403', async () => {
    const res = await request(app)
      .post('/api/appointments/abc123/resolve-renewal')
      .set(headersForRole(ROLES.SUPER_ADMIN))
      .send({ planId: 'abc', contractDate: '2026-07-24', duration: 20 });

    expect(res.status).toBe(403);
  });
});
