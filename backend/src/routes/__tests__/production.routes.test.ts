import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../services/auth';
import { ROLES } from '../../constants/roles.constants';
import * as productionService from '../../services/production';

jest.mock('../../services/auth');
jest.mock('../../services/production');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const mockVerifyToken = verifyToken as jest.Mock;

const headersForRole = (role: string) => {
  mockVerifyToken.mockReturnValue({ userId: 1, role });
  return { Authorization: 'Bearer test-token' };
};

beforeEach(() => {
  jest.clearAllMocks();
  (productionService.findGroups as jest.Mock).mockResolvedValue({
    date: '2026-07-02',
    isDeliveryDay: true,
    total: 0,
    groups: { juice: [], lunchOnly: [], lunchAndDinner: [], full: [] },
  });
});

describe('GET /api/production role guard', () => {
  it('allows super_admin', async () => {
    const res = await request(app).get('/api/production').set(headersForRole(ROLES.SUPER_ADMIN));

    expect(res.status).toBe(200);
  });

  it('allows admin', async () => {
    const res = await request(app).get('/api/production').set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(200);
  });

  it('allows kitchen', async () => {
    const res = await request(app).get('/api/production').set(headersForRole(ROLES.KITCHEN));

    expect(res.status).toBe(200);
  });

  it('rejects delivery with 403', async () => {
    const res = await request(app).get('/api/production').set(headersForRole(ROLES.DELIVERY));

    expect(res.status).toBe(403);
  });

  it('rejects requests with no token with 401', async () => {
    const res = await request(app).get('/api/production');

    expect(res.status).toBe(401);
  });
});
