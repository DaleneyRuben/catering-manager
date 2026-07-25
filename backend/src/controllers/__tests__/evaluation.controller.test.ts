import type { Request } from 'express';
import request from 'supertest';
import app from '../../app';
import * as evaluationService from '../../services/evaluation';
import { encodeId } from '../../utils/sqids';

jest.mock('../../services/evaluation');
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
    (evaluationService.findPendingPayment as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/api/evaluations/pending-payment');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/evaluations/:id/mark-paid', () => {
  it('returns 200 with the updated subscription', async () => {
    (evaluationService.markPaid as jest.Mock).mockResolvedValue({ id: 3, paid: true });

    const res = await request(app).post(`/api/evaluations/${id1}/mark-paid`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ paid: true });
  });

  it('returns 404 when the client has no pending payment', async () => {
    (evaluationService.markPaid as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post(`/api/evaluations/${id999}/mark-paid`);

    expect(res.status).toBe(404);
  });

  it('forwards the acting user to the service', async () => {
    (evaluationService.markPaid as jest.Mock).mockResolvedValue({ id: 3, paid: true });

    await request(app).post(`/api/evaluations/${id1}/mark-paid`);

    expect(evaluationService.markPaid).toHaveBeenCalledWith(1, { userId: 9, username: 'ada' });
  });
});

describe('DELETE /api/evaluations/:id', () => {
  it('returns 200 when the pending client is deleted', async () => {
    (evaluationService.deletePendingClient as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await request(app).delete(`/api/evaluations/${id1}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when the client does not exist', async () => {
    (evaluationService.deletePendingClient as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(`/api/evaluations/${id999}`);

    expect(res.status).toBe(404);
  });

  it('forwards the acting user to the service', async () => {
    (evaluationService.deletePendingClient as jest.Mock).mockResolvedValue({ id: 1 });

    await request(app).delete(`/api/evaluations/${id1}`);

    expect(evaluationService.deletePendingClient).toHaveBeenCalledWith(1, {
      userId: 9,
      username: 'ada',
    });
  });
});
