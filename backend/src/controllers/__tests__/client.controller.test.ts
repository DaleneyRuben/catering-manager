import request from 'supertest';
import app from '../../app';
import clientService from '../../services/client.service';
import { encodeId } from '../../utils/sqids';

jest.mock('../../services/client.service');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
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
    (clientService.findAll as jest.Mock).mockResolvedValue({ rows: [mockClient], total: 1 });

    const res = await request(app).get('/api/clients');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ name: 'John Doe' });
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(25);
  });

  it('forwards page and limit to service', async () => {
    (clientService.findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients?page=2&limit=10');

    expect(clientService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });

  it('defaults to page 1 and limit 25', async () => {
    (clientService.findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients');

    expect(clientService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 25 }),
    );
  });

  it('forwards status query param to service', async () => {
    (clientService.findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients?status=active');

    expect(clientService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
    );
  });

  it('forwards q query param to service', async () => {
    (clientService.findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients?q=maria');

    expect(clientService.findAll).toHaveBeenCalledWith(expect.objectContaining({ q: 'maria' }));
  });

  it('forwards birthMonth query param to service as number', async () => {
    (clientService.findAll as jest.Mock).mockResolvedValue({ rows: [], total: 0 });

    await request(app).get('/api/clients?birthMonth=3');

    expect(clientService.findAll).toHaveBeenCalledWith(expect.objectContaining({ birthMonth: 3 }));
  });

  it('returns 500 when service throws', async () => {
    (clientService.findAll as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/clients');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/clients/:id', () => {
  it('returns 200 with client when found', async () => {
    (clientService.findById as jest.Mock).mockResolvedValue(mockClient);

    const res = await request(app).get(`/api/clients/${id1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: id1, name: 'John Doe' });
  });

  it('returns 404 when client not found', async () => {
    (clientService.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/clients/${id999}`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (clientService.findById as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get(`/api/clients/${id1}`);

    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/clients/:id', () => {
  it('returns 200 when setting pausedSince', async () => {
    const pausedSince = '2026-06-10T12:00:00Z';
    (clientService.update as jest.Mock).mockResolvedValue({ ...mockClient, pausedSince });

    const res = await request(app).patch(`/api/clients/${id1}`).send({ pausedSince });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ pausedSince });
  });

  it('returns 200 when updating identity fields', async () => {
    (clientService.update as jest.Mock).mockResolvedValue({
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
    (clientService.update as jest.Mock).mockResolvedValue(null);

    const res = await request(app).patch(`/api/clients/${id999}`).send({ name: 'Jane' });

    expect(res.status).toBe(404);
  });

  it('returns 400 with invalid body', async () => {
    const res = await request(app).patch(`/api/clients/${id1}`).send({ sex: 'alien' });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (clientService.update as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).patch(`/api/clients/${id1}`).send({ name: 'Jane' });

    expect(res.status).toBe(500);
  });
});

describe('POST /api/clients', () => {
  it('returns 201 with created client', async () => {
    (clientService.create as jest.Mock).mockResolvedValue(mockClient);

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
    (clientService.create as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post('/api/clients').send(validPayload);

    expect(res.status).toBe(500);
  });
});

describe('GET /api/clients/counts', () => {
  const mockCounts = { active: 10, expiring: 5, paused: 3, ended: 2, total: 20 };

  it('returns 200 with counts', async () => {
    (clientService.getCounts as jest.Mock).mockResolvedValue(mockCounts);

    const res = await request(app).get('/api/clients/counts');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockCounts);
  });

  it('returns 500 when service throws', async () => {
    (clientService.getCounts as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/clients/counts');

    expect(res.status).toBe(500);
  });
});

describe('POST /api/clients/:id/finalize', () => {
  it('returns 200 when client is finalized', async () => {
    (clientService.finalize as jest.Mock).mockResolvedValue({});

    const res = await request(app).post(`/api/clients/${id1}/finalize`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when client not found', async () => {
    (clientService.finalize as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post(`/api/clients/${id999}/finalize`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (clientService.finalize as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post(`/api/clients/${id1}/finalize`);

    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/clients/:id', () => {
  it('returns 200 when client is soft-deleted', async () => {
    (clientService.softDelete as jest.Mock).mockResolvedValue({});

    const res = await request(app).delete(`/api/clients/${id1}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when client not found', async () => {
    (clientService.softDelete as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(`/api/clients/${id999}`);

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (clientService.softDelete as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).delete(`/api/clients/${id1}`);

    expect(res.status).toBe(500);
  });
});
