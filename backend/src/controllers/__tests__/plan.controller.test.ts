import request from 'supertest';
import app from '../../app';
import * as planService from '../../services/plan';
import { encodeId } from '../../utils/sqids';

jest.mock('../../services/plan');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const id1 = encodeId(1);
const id999 = encodeId(999);

const mockPlan = {
  id: 1,
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  price: 150.0,
  discount: 0,
};

const validPayload = {
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  price: 150.0,
  discount: 0,
};

describe('GET /api/plans/client-counts', () => {
  it('returns 200 with plan client counts, keyed by encoded planId', async () => {
    (planService.getClientCounts as jest.Mock).mockResolvedValue([
      { planId: 1, count: 5 },
      { planId: 2, count: 3 },
    ]);

    const res = await request(app).get('/api/plans/client-counts');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { planId: id1, count: 5 },
      { planId: encodeId(2), count: 3 },
    ]);
  });

  it('returns 500 when service throws', async () => {
    (planService.getClientCounts as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/plans/client-counts');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/plans', () => {
  it('returns 200 with list of plans', async () => {
    (planService.findAll as jest.Mock).mockResolvedValue([mockPlan]);

    const res = await request(app).get('/api/plans');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ name: 'Full Plan' });
  });

  it('returns 500 when service throws', async () => {
    (planService.findAll as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/plans');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/plans/:id', () => {
  it('returns 200 with plan when found', async () => {
    (planService.findById as jest.Mock).mockResolvedValue(mockPlan);

    const res = await request(app).get(`/api/plans/${id1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: id1, name: 'Full Plan' });
  });

  it('returns 404 when plan not found', async () => {
    (planService.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/plans/${id999}`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (planService.findById as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get(`/api/plans/${id1}`);

    expect(res.status).toBe(500);
  });
});

describe('POST /api/plans', () => {
  it('returns 201 with created plan', async () => {
    (planService.create as jest.Mock).mockResolvedValue(mockPlan);

    const res = await request(app).post('/api/plans').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Full Plan' });
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/plans')
      .send({ ...validPayload, name: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when meals is empty', async () => {
    const res = await request(app)
      .post('/api/plans')
      .send({ ...validPayload, meals: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 when meal value is invalid', async () => {
    const res = await request(app)
      .post('/api/plans')
      .send({ ...validPayload, meals: ['breakfast', 'brunch'] });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (planService.create as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post('/api/plans').send(validPayload);

    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/plans/:id', () => {
  it('returns 204 when plan is deleted', async () => {
    (planService.remove as jest.Mock).mockResolvedValue(true);

    const res = await request(app).delete(`/api/plans/${id1}`);

    expect(res.status).toBe(204);
  });

  it('returns 404 when plan not found', async () => {
    (planService.remove as jest.Mock).mockResolvedValue(false);

    const res = await request(app).delete(`/api/plans/${id999}`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (planService.remove as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).delete(`/api/plans/${id1}`);

    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/plans/:id', () => {
  it('returns 200 with updated plan', async () => {
    const updated = { ...mockPlan, name: 'Updated Plan' };
    (planService.update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app).patch(`/api/plans/${id1}`).send({ name: 'Updated Plan' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Updated Plan' });
  });

  it('returns 404 when plan not found', async () => {
    (planService.update as jest.Mock).mockResolvedValue(null);

    const res = await request(app).patch(`/api/plans/${id999}`).send({ name: 'Updated Plan' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when meal value is invalid', async () => {
    const res = await request(app)
      .patch(`/api/plans/${id1}`)
      .send({ meals: ['breakfast', 'brunch'] });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (planService.update as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).patch(`/api/plans/${id1}`).send({ name: 'Updated Plan' });

    expect(res.status).toBe(500);
  });
});
