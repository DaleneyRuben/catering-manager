import type { Request } from 'express';
import request from 'supertest';
import app from '../../app';
import {
  deletePendingClient,
  findPendingPayment,
  markPaid,
  revertPendingRenewal,
} from '../../domains/evaluation';
import { encodeId } from '../../utils/sqids';

jest.mock('../../domains/evaluation');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req: Request, _res: unknown, next: () => void) => {
    req.user = { userId: 9, username: 'ada', role: 'admin' };
    next();
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const id1 = encodeId(1);
const id999 = encodeId(999);

describe('GET /api/evaluations/pending-payment', () => {
  it('returns 200 with clients pending payment', async () => {
    (findPendingPayment as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/api/evaluations/pending-payment');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/evaluations/:id/mark-paid', () => {
  it('returns 200 with the updated subscription', async () => {
    (markPaid as jest.Mock).mockResolvedValue({ id: 3, paid: true });

    const res = await request(app).post(`/api/evaluations/${id1}/mark-paid`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ paid: true });
  });

  it('returns 404 when the client has no pending payment', async () => {
    (markPaid as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post(`/api/evaluations/${id999}/mark-paid`);

    expect(res.status).toBe(404);
  });

  it('forwards the acting user to the service', async () => {
    (markPaid as jest.Mock).mockResolvedValue({ id: 3, paid: true });

    await request(app).post(`/api/evaluations/${id1}/mark-paid`);

    expect(markPaid).toHaveBeenCalledWith(1, { userId: 9, username: 'ada' });
  });
});

describe('DELETE /api/evaluations/:id/pending-renewal', () => {
  it('returns 200 when the pending renewal is reverted', async () => {
    (revertPendingRenewal as jest.Mock).mockResolvedValue({ id: 5 });

    const res = await request(app).delete(`/api/evaluations/${id1}/pending-renewal`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when the client has no pending renewal', async () => {
    (revertPendingRenewal as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(`/api/evaluations/${id999}/pending-renewal`);

    expect(res.status).toBe(404);
  });

  it('decodes the client id and forwards it to the service', async () => {
    (revertPendingRenewal as jest.Mock).mockResolvedValue({ id: 5 });

    await request(app).delete(`/api/evaluations/${id1}/pending-renewal`);

    expect(revertPendingRenewal).toHaveBeenCalledWith(1);
  });
});

describe('DELETE /api/evaluations/:id', () => {
  it('returns 200 when the pending client is deleted', async () => {
    (deletePendingClient as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await request(app).delete(`/api/evaluations/${id1}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when the client does not exist', async () => {
    (deletePendingClient as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(`/api/evaluations/${id999}`);

    expect(res.status).toBe(404);
  });

  it('forwards the acting user to the service', async () => {
    (deletePendingClient as jest.Mock).mockResolvedValue({ id: 1 });

    await request(app).delete(`/api/evaluations/${id1}`);

    expect(deletePendingClient).toHaveBeenCalledWith(1, {
      userId: 9,
      username: 'ada',
    });
  });
});
