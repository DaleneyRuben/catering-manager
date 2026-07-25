import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../services/auth';
import { ROLES } from '../../constants/roles.constants';
import * as subscriptionService from '../../services/subscription';
import { encodeId } from '../../utils/sqids';

jest.mock('../../services/auth');
jest.mock('../../services/subscription');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const mockVerifyToken = verifyToken as jest.Mock;

const headersForRole = (role: string) => {
  mockVerifyToken.mockReturnValue({ userId: 1, username: 'ada', role });
  return { Authorization: 'Bearer test-token' };
};

const clientId = encodeId(1);

beforeEach(() => {
  jest.clearAllMocks();
  (subscriptionService.create as jest.Mock).mockResolvedValue({ id: 1 });
});

describe('POST /api/clients/:clientId/subscriptions role guard', () => {
  const validBody = { planId: encodeId(1), duration: 20, contractDate: '2026-07-25' };

  it('allows nutritionist', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/subscriptions`)
      .set(headersForRole(ROLES.NUTRITIONIST))
      .send(validBody);

    expect(res.status).toBe(201);
  });

  it('allows admin', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/subscriptions`)
      .set(headersForRole(ROLES.ADMIN))
      .send(validBody);

    expect(res.status).toBe(201);
  });

  it('rejects kitchen with 403', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/subscriptions`)
      .set(headersForRole(ROLES.KITCHEN))
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('rejects requests with no token with 401', async () => {
    const res = await request(app).post(`/api/clients/${clientId}/subscriptions`).send(validBody);

    expect(res.status).toBe(401);
  });
});

describe('admin-only subscription mutation routes role guard', () => {
  it('rejects nutritionist on PATCH /api/clients/:clientId/subscriptions/:id with 403', async () => {
    const res = await request(app)
      .patch(`/api/clients/${clientId}/subscriptions/abc123`)
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });
});
