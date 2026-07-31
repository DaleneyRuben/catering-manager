import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../domains/auth';
import { ROLES } from '../../constants/roles.constants';
import { findById } from '../../domains/client';
import { clientHasAppointment } from '../../domains/evaluation';
import { encodeId } from '../../utils/sqids';

jest.mock('../../domains/auth');
jest.mock('../../domains/client');
jest.mock('../../domains/evaluation');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const mockVerifyToken = verifyToken as jest.Mock;

const headersForRole = (role: string) => {
  mockVerifyToken.mockReturnValue({ userId: 1, username: 'ada', role });
  return { Authorization: 'Bearer test-token' };
};

const clientId = encodeId(1);

beforeEach(() => {
  jest.clearAllMocks();
  (findById as jest.Mock).mockResolvedValue({ id: 1 });
  (clientHasAppointment as jest.Mock).mockResolvedValue(false);
});

describe('GET /api/clients/:id role guard', () => {
  it('allows nutritionist when an appointment links her to this client', async () => {
    (clientHasAppointment as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .get(`/api/clients/${clientId}`)
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(200);
  });

  it('rejects nutritionist with 403 when no appointment links her to this client', async () => {
    (clientHasAppointment as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .get(`/api/clients/${clientId}`)
      .set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
    expect(findById).not.toHaveBeenCalled();
  });

  it('allows admin regardless of any appointment link', async () => {
    const res = await request(app).get(`/api/clients/${clientId}`).set(headersForRole(ROLES.ADMIN));

    expect(res.status).toBe(200);
    expect(clientHasAppointment).not.toHaveBeenCalled();
  });

  it('rejects kitchen with 403', async () => {
    const res = await request(app)
      .get(`/api/clients/${clientId}`)
      .set(headersForRole(ROLES.KITCHEN));

    expect(res.status).toBe(403);
  });

  it('rejects requests with no token with 401', async () => {
    const res = await request(app).get(`/api/clients/${clientId}`);

    expect(res.status).toBe(401);
  });
});

describe('admin-only client routes role guard', () => {
  const cases = [
    { method: 'get' as const, path: '/api/clients' },
    { method: 'get' as const, path: '/api/clients/search' },
    { method: 'get' as const, path: '/api/clients/abc123/history' },
    { method: 'post' as const, path: '/api/clients' },
    { method: 'patch' as const, path: '/api/clients/abc123' },
    { method: 'post' as const, path: '/api/clients/abc123/finalize' },
    { method: 'put' as const, path: '/api/clients/abc123/group' },
    { method: 'delete' as const, path: '/api/clients/abc123' },
  ];

  it.each(cases)('rejects nutritionist on $method $path with 403', async ({ method, path }) => {
    const res = await request(app)[method](path).set(headersForRole(ROLES.NUTRITIONIST));

    expect(res.status).toBe(403);
  });
});
