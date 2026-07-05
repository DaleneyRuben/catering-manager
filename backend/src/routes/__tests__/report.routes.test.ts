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

describe('GET /api/reports/kitchen-report/download role guard', () => {
  it('rejects kitchen role with 403', async () => {
    const res = await request(app)
      .get('/api/reports/kitchen-report/download')
      .set(headersForRole(ROLES.KITCHEN));

    expect(res.status).toBe(403);
  });

  it('allows admin role past the guard', async () => {
    const res = await request(app)
      .get('/api/reports/kitchen-report/download')
      .set(headersForRole(ROLES.ADMIN));

    expect(res.status).not.toBe(403);
  });
});

describe('GET /api/reports/active-clients/download role guard', () => {
  it('allows kitchen role past the guard', async () => {
    const res = await request(app)
      .get('/api/reports/active-clients/download')
      .set(headersForRole(ROLES.KITCHEN));

    expect(res.status).not.toBe(403);
  });
});

describe('GET /api/reports/menu-card/download role guard', () => {
  it('allows kitchen role past the guard', async () => {
    const res = await request(app)
      .get('/api/reports/menu-card/download')
      .set(headersForRole(ROLES.KITCHEN));

    expect(res.status).not.toBe(403);
  });
});
