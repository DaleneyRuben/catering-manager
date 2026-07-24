import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../services/auth';
import { ROLES } from '../../constants/roles.constants';
import * as planService from '../../services/plan';

jest.mock('../../services/auth');
jest.mock('../../services/plan');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const mockVerifyToken = verifyToken as jest.Mock;

const headersForRole = (role: string) => {
  mockVerifyToken.mockReturnValue({ userId: 1, role });
  return { Authorization: 'Bearer test-token' };
};

beforeEach(() => {
  jest.clearAllMocks();
  (planService.findAll as jest.Mock).mockResolvedValue([]);
  (planService.getClientCounts as jest.Mock).mockResolvedValue([]);
});

describe('GET /api/plans role guard', () => {
  it('allows nutritionist', async () => {
    const res = await request(app).get('/api/plans').set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(200);
  });

  it('allows admin', async () => {
    const res = await request(app).get('/api/plans').set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(200);
  });
});

describe('GET /api/plans/client-counts role guard', () => {
  it('allows nutritionist', async () => {
    const res = await request(app)
      .get('/api/plans/client-counts')
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(200);
  });
});

describe('admin-only plan mutation routes role guard', () => {
  const cases = [
    { method: 'post' as const, path: '/api/plans' },
    { method: 'patch' as const, path: '/api/plans/abc123' },
    { method: 'delete' as const, path: '/api/plans/abc123' },
  ];

  it.each(cases)('rejects nutritionist on $method $path with 403', async ({ method, path }) => {
    const res = await request(app)[method](path).set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });

  it('rejects nutritionist on GET /api/plans/abc123 with 403', async () => {
    const res = await request(app).get('/api/plans/abc123').set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });
});
