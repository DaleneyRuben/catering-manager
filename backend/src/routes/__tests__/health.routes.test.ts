import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../services/auth';
import { ROLES } from '../../constants/roles.constants';

jest.mock('../../services/auth');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const mockVerifyToken = verifyToken as jest.Mock;

const headersForRole = (role: string) => {
  mockVerifyToken.mockReturnValue({ userId: 1, role });
  return { Authorization: 'Bearer test-token' };
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/health role guard', () => {
  it('allows super_admin', async () => {
    const res = await request(app).get('/api/health').set(headersForRole(ROLES.SUPER_ADMIN));

    expect(res.status).not.toBe(403);
  });

  it('rejects admin with 403', async () => {
    const res = await request(app).get('/api/health').set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(403);
  });

  it('rejects kitchen with 403', async () => {
    const res = await request(app).get('/api/health').set(headersForRole(ROLES.KITCHEN));

    expect(res.status).toBe(403);
  });

  it('rejects requests with no token with 401', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(401);
  });
});
