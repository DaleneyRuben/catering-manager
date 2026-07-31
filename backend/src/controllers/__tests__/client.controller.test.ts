import type { Request } from 'express';
import request from 'supertest';
import app from '../../app';
import {
  create,
  finalize,
  findAll,
  findById,
  search,
  softDelete,
  update,
} from '../../domains/client';
import { encodeId } from '../../utils/sqids';

jest.mock('../../domains/client');
jest.mock('../../domains/delivery');
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

const mockClient = {
  id: 1,
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: ['diabetes'],
  restrictions: ['gluten'],
  pausedSince: null,
  status: 'active',
};

const validPayload = {
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  underlyingDiseases: ['diabetes'],
  restrictions: ['gluten'],
};

describe('GET /api/clients', () => {
  it('returns 200 with paginated clients', async () => {
    (findAll as jest.Mock).mockResolvedValue({ rows: [mockClient], total: 1 });

    const res = await request(app).get('/api/clients');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ name: 'John Doe' });
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(25);
  });

  it('forwards page and limit to service', async () => {
    (findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients?page=2&limit=10');

    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 10 }));
  });

  it('defaults to page 1 and limit 25', async () => {
    (findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients');

    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 25 }));
  });

  it('forwards status query param to service', async () => {
    (findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients?status=active');

    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('forwards q query param to service', async () => {
    (findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients?q=maria');

    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ q: 'maria' }));
  });

  it('forwards restriction query param to service', async () => {
    (findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get(`/api/clients?restriction=${encodeURIComponent('maní')}`);

    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ restriction: 'maní' }));
  });

  it('ignores birthMonth query param (filter has been removed)', async () => {
    (findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients?birthMonth=3');

    expect(findAll).toHaveBeenCalledWith(
      expect.not.objectContaining({ birthMonth: expect.anything() }),
    );
  });

  it('returns 500 when service throws', async () => {
    (findAll as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/clients');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/clients/search', () => {
  it('returns 200 with matching clients when q is provided', async () => {
    (search as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Fernando Daleney', phoneNumber: '76637732' },
    ]);

    const res = await request(app).get('/api/clients/search?q=fernando');

    expect(search).toHaveBeenCalledWith('fernando');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ id: id1, name: 'Fernando Daleney', phoneNumber: '76637732' }]);
  });

  it('returns an empty list without querying when q is missing', async () => {
    (search as jest.Mock).mockClear();

    const res = await request(app).get('/api/clients/search');

    expect(search).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('does not get shadowed by the /:id route', async () => {
    (search as jest.Mock).mockResolvedValue([]);
    (findById as jest.Mock).mockClear();

    await request(app).get('/api/clients/search?q=x');

    expect(findById).not.toHaveBeenCalled();
  });

  it('returns 500 when service throws', async () => {
    (search as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/clients/search?q=x');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/clients/:id', () => {
  it('returns 200 with client when found', async () => {
    (findById as jest.Mock).mockResolvedValue(mockClient);

    const res = await request(app).get(`/api/clients/${id1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: id1, name: 'John Doe' });
  });

  it('returns 404 when client not found', async () => {
    (findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/clients/${id999}`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (findById as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get(`/api/clients/${id1}`);

    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/clients/:id', () => {
  it('returns 200 when setting pausedSince', async () => {
    const pausedSince = '2026-06-10T12:00:00Z';
    (update as jest.Mock).mockResolvedValue({ ...mockClient, pausedSince });

    const res = await request(app).patch(`/api/clients/${id1}`).send({ pausedSince });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ pausedSince });
  });

  it('forwards the acting user to the service', async () => {
    const pausedSince = '2026-06-10T12:00:00Z';
    (update as jest.Mock).mockResolvedValue({ ...mockClient, pausedSince });

    await request(app).patch(`/api/clients/${id1}`).send({ pausedSince });

    expect(update).toHaveBeenCalledWith(1, expect.objectContaining({ pausedSince }), {
      userId: 9,
      username: 'ada',
    });
  });

  it('returns 200 when updating identity fields', async () => {
    (update as jest.Mock).mockResolvedValue({
      ...mockClient,
      name: 'Jane Doe',
      phoneNumber: '+9876543210',
    });

    const res = await request(app)
      .patch(`/api/clients/${id1}`)
      .send({ name: 'Jane Doe', phoneNumber: '+9876543210' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Jane Doe', phoneNumber: '+9876543210' });
  });

  it('returns 400 when sex is invalid', async () => {
    const res = await request(app).patch(`/api/clients/${id1}`).send({ sex: 'alien' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when deliveryZone is invalid', async () => {
    const res = await request(app).patch(`/api/clients/${id1}`).send({ deliveryZone: 'Norte' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when client not found', async () => {
    (update as jest.Mock).mockResolvedValue(null);

    const res = await request(app).patch(`/api/clients/${id999}`).send({ name: 'Jane' });

    expect(res.status).toBe(404);
  });

  it('returns 400 with invalid body', async () => {
    const res = await request(app).patch(`/api/clients/${id1}`).send({ sex: 'alien' });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (update as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).patch(`/api/clients/${id1}`).send({ name: 'Jane' });

    expect(res.status).toBe(500);
  });
});

describe('POST /api/clients', () => {
  it('returns 201 with created client', async () => {
    (create as jest.Mock).mockResolvedValue(mockClient);

    const res = await request(app).post('/api/clients').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'John Doe', sex: 'male' });
  });

  it('returns 400 when required field is missing', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ ...validPayload, name: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when sex is invalid', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ ...validPayload, sex: 'alien' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when dateOfBirth format is invalid', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ ...validPayload, dateOfBirth: '15-05-1990' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when deliveryZone is invalid', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ ...validPayload, deliveryZone: 'Norte' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when delivery is invalid', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ ...validPayload, delivery: 'Unknown' });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (create as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post('/api/clients').send(validPayload);

    expect(res.status).toBe(500);
  });
});

describe('POST /api/clients/:id/finalize', () => {
  it('returns 200 when client is finalized', async () => {
    (finalize as jest.Mock).mockResolvedValue({});

    const res = await request(app).post(`/api/clients/${id1}/finalize`);

    expect(res.status).toBe(200);
  });

  it('forwards the acting user to the service', async () => {
    (finalize as jest.Mock).mockResolvedValue({});

    await request(app).post(`/api/clients/${id1}/finalize`);

    expect(finalize).toHaveBeenCalledWith(1, { userId: 9, username: 'ada' });
  });

  it('returns 404 when client not found', async () => {
    (finalize as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post(`/api/clients/${id999}/finalize`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (finalize as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post(`/api/clients/${id1}/finalize`);

    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/clients/:id', () => {
  it('returns 200 when client is soft-deleted', async () => {
    (softDelete as jest.Mock).mockResolvedValue({});

    const res = await request(app).delete(`/api/clients/${id1}`);

    expect(res.status).toBe(200);
  });

  it('forwards the acting user to the service', async () => {
    (softDelete as jest.Mock).mockResolvedValue({});

    await request(app).delete(`/api/clients/${id1}`);

    expect(softDelete).toHaveBeenCalledWith(1, { userId: 9, username: 'ada' });
  });

  it('returns 404 when client not found', async () => {
    (softDelete as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(`/api/clients/${id999}`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (softDelete as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).delete(`/api/clients/${id1}`);

    expect(res.status).toBe(500);
  });
});

describe('PUT /api/clients/:id/group', () => {
  it('returns 200 with updated client after setting group members', async () => {
    (findById as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'John',
      groupMembers: [{ id: 2, name: 'Ana' }],
    });

    const res = await request(app)
      .put(`/api/clients/${id1}/group`)
      .send({ memberIds: [encodeId(2)] });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ groupMembers: expect.any(Array) });
  });

  it('returns 200 with empty groupMembers when memberIds is empty', async () => {
    (findById as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'John',
      groupMembers: [],
    });

    const res = await request(app).put(`/api/clients/${id1}/group`).send({ memberIds: [] });

    expect(res.status).toBe(200);
  });

  it('returns 400 when memberIds is missing', async () => {
    const res = await request(app).put(`/api/clients/${id1}/group`).send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 when client is not found', async () => {
    (findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).put(`/api/clients/${id999}/group`).send({ memberIds: [] });

    expect(res.status).toBe(404);
  });
});
