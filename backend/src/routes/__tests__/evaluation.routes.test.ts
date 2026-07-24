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
  (evaluationService.findPendingPayment as jest.Mock).mockResolvedValue([]);
});

describe('GET /api/evaluations/pending-payment role guard', () => {
  it('allows super_admin', async () => {
    const res = await request(app)
      .get('/api/evaluations/pending-payment')
      .set(headersForRole(ROLES.SUPER_ADMIN));

    expect(res.status).toBe(200);
  });

  it('allows admin', async () => {
    const res = await request(app)
      .get('/api/evaluations/pending-payment')
      .set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(200);
  });

  it('rejects nutritionist with 403', async () => {
    const res = await request(app)
      .get('/api/evaluations/pending-payment')
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });

  it('rejects kitchen with 403', async () => {
    const res = await request(app)
      .get('/api/evaluations/pending-payment')
      .set(headersForRole(ROLES.KITCHEN));

    expect(res.status).toBe(403);
  });

  it('rejects delivery with 403', async () => {
    const res = await request(app)
      .get('/api/evaluations/pending-payment')
      .set(headersForRole(ROLES.DELIVERY));

    expect(res.status).toBe(403);
  });

  it('rejects requests with no token with 401', async () => {
    const res = await request(app).get('/api/evaluations/pending-payment');

    expect(res.status).toBe(401);
  });
});

describe('admin-only evaluations mutation routes role guard', () => {
  const cases = [
    { method: 'post' as const, path: '/api/evaluations/abc123/mark-paid' },
    { method: 'delete' as const, path: '/api/evaluations/abc123' },
  ];

  it.each(cases)('rejects nutritionist on $method $path with 403', async ({ method, path }) => {
    const res = await request(app)[method](path).set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });
});
