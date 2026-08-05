import type { Request } from 'express';
import request from 'supertest';
import app from '../../app';
import {
  cancelAppointment,
  convertAppointment,
  createAppointment,
  findById,
  findHistoryForNutritionist,
  findPendingForAdmin,
  findPendingForNutritionist,
  resolveRenewal,
  updateAppointment,
} from '../../domains/evaluation';
import { encodeId } from '../../utils/sqids';
import { appToday } from '../../utils/date';

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

// createAppointmentSchema rejects a past date, so a hardcoded one turns the suite red on whatever
// day it goes by. Scheduling for today keeps these tests about the controller.
const scheduledDate = appToday();

beforeEach(() => jest.clearAllMocks());

const validPayload = {
  name: 'Ana Pérez',
  phone: '71234567',
  date: scheduledDate,
  time: '09:00',
};

describe('POST /api/appointments', () => {
  it('returns 201 with the created appointment', async () => {
    (createAppointment as jest.Mock).mockResolvedValue({
      id: 1,
      ...validPayload,
    });

    const res = await request(app).post('/api/appointments').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject(validPayload);
  });

  it('returns 400 when date is in the past', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ ...validPayload, date: '2026-01-01' });

    expect(res.status).toBe(400);
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ ...validPayload, name: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (createAppointment as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post('/api/appointments').send(validPayload);

    expect(res.status).toBe(500);
  });

  it('decodes clientId and passes it to the service in existing-client mode', async () => {
    (createAppointment as jest.Mock).mockResolvedValue({
      id: 1,
      clientId: 5,
      name: 'Fernando Daleney',
      phone: '76637732',
      date: scheduledDate,
      time: '09:00',
    });

    const res = await request(app)
      .post('/api/appointments')
      .send({ clientId: encodeId(5), date: scheduledDate, time: '09:00' });

    expect(res.status).toBe(201);
    expect(createAppointment).toHaveBeenCalledWith({
      clientId: 5,
      date: scheduledDate,
      time: '09:00',
    });
  });

  it('returns 404 when the linked client does not exist', async () => {
    (createAppointment as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/appointments')
      .send({ clientId: encodeId(999), date: scheduledDate, time: '09:00' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when both clientId and name/phone are provided', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ clientId: encodeId(5), ...validPayload });

    expect(res.status).toBe(400);
    expect(createAppointment).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/appointments/:id', () => {
  it('returns 200 with the updated appointment', async () => {
    (updateAppointment as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Nuevo nombre',
    });

    const res = await request(app).patch(`/api/appointments/${id1}`).send({ name: 'Nuevo nombre' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Nuevo nombre' });
  });

  it('returns 404 when the appointment does not exist', async () => {
    (updateAppointment as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/appointments/${id999}`)
      .send({ name: 'Nuevo nombre' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when date is in the past', async () => {
    const res = await request(app).patch(`/api/appointments/${id1}`).send({ date: '2026-01-01' });

    expect(res.status).toBe(400);
  });

  it('decodes subscriptionId and passes it to the service when stamping a renewal', async () => {
    (updateAppointment as jest.Mock).mockResolvedValue({
      id: 1,
      subscriptionId: 3,
    });

    const res = await request(app)
      .patch(`/api/appointments/${id1}`)
      .send({ subscriptionId: encodeId(3) });

    expect(res.status).toBe(200);
    expect(updateAppointment).toHaveBeenCalledWith(1, { subscriptionId: 3 });
  });
});

describe('DELETE /api/appointments/:id', () => {
  it('returns 200 when the appointment is cancelled', async () => {
    (cancelAppointment as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await request(app).delete(`/api/appointments/${id1}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when the appointment does not exist or is already converted', async () => {
    (cancelAppointment as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(`/api/appointments/${id999}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/appointments/pending', () => {
  it('returns 200 with the pending appointments', async () => {
    (findPendingForAdmin as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/api/appointments/pending');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/appointments/:id', () => {
  it('returns 200 with the appointment', async () => {
    (findById as jest.Mock).mockResolvedValue({
      id: 1,
      clientId: 5,
      name: 'Fernando Daleney',
      phone: '76637732',
    });

    const res = await request(app).get(`/api/appointments/${id1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Fernando Daleney' });
  });

  it('returns 404 when the appointment does not exist', async () => {
    (findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/appointments/${id999}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/appointments/nutritionist/pending', () => {
  it('returns 200 with the pending appointments', async () => {
    (findPendingForNutritionist as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/api/appointments/nutritionist/pending');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/appointments/nutritionist/history', () => {
  it('returns 200 with paginated history', async () => {
    (findHistoryForNutritionist as jest.Mock).mockResolvedValue({
      rows: [{ id: 1 }],
      total: 1,
    });

    const res = await request(app).get('/api/appointments/nutritionist/history');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(25);
  });

  it('forwards status, q, dateFrom, dateTo, page, and limit to the service', async () => {
    (findHistoryForNutritionist as jest.Mock).mockResolvedValue({
      rows: [],
      total: 0,
    });

    await request(app).get(
      '/api/appointments/nutritionist/history?status=pagado&q=Julia&dateFrom=2026-08-01&dateTo=2026-08-10&page=2&limit=10',
    );

    expect(findHistoryForNutritionist).toHaveBeenCalledWith({
      status: 'pagado',
      q: 'Julia',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-10',
      page: 2,
      limit: 10,
    });
  });

  it('ignores an invalid status value', async () => {
    (findHistoryForNutritionist as jest.Mock).mockResolvedValue({
      rows: [],
      total: 0,
    });

    await request(app).get('/api/appointments/nutritionist/history?status=bogus');

    expect(findHistoryForNutritionist).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined }),
    );
  });

  it('defaults to page 1 and limit 25', async () => {
    (findHistoryForNutritionist as jest.Mock).mockResolvedValue({
      rows: [],
      total: 0,
    });

    await request(app).get('/api/appointments/nutritionist/history');

    expect(findHistoryForNutritionist).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 25 }),
    );
  });
});

describe('POST /api/appointments/:id/convert', () => {
  const clientData = {
    name: 'Ana',
    sex: 'male',
    dateOfBirth: '1990-01-01',
    phoneNumber: '123',
    address: 'Calle 1',
    deliveryZone: 'Centro',
    delivery: 'La Oliva',
  };

  const subscriptionData = {
    planId: encodeId(2),
    contractDate: '2026-07-24',
    duration: 20,
    paid: true,
  };

  it('returns 201 with the client and subscription', async () => {
    (convertAppointment as jest.Mock).mockResolvedValue({
      client: { id: 7 },
      subscription: { id: 3 },
    });

    const res = await request(app)
      .post(`/api/appointments/${id1}/convert`)
      .send({ client: clientData, subscription: subscriptionData });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ client: {}, subscription: {} });
  });

  it('returns 404 when the appointment does not exist or is already converted', async () => {
    (convertAppointment as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/appointments/${id999}/convert`)
      .send({ client: clientData, subscription: subscriptionData });

    expect(res.status).toBe(404);
  });

  it('forwards the acting user to the service', async () => {
    (convertAppointment as jest.Mock).mockResolvedValue({
      client: { id: 7 },
      subscription: { id: 3 },
    });

    await request(app)
      .post(`/api/appointments/${id1}/convert`)
      .send({ client: clientData, subscription: subscriptionData });

    expect(convertAppointment).toHaveBeenCalledWith(1, expect.anything(), expect.anything(), {
      userId: 9,
      username: 'ada',
    });
  });

  it('returns 400 when client data is invalid', async () => {
    const res = await request(app)
      .post(`/api/appointments/${id1}/convert`)
      .send({ client: { ...clientData, name: '' }, subscription: subscriptionData });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/appointments/:id/resolve-renewal', () => {
  const subscriptionData = {
    planId: encodeId(2),
    contractDate: '2026-07-24',
    duration: 20,
  };

  it('returns 201 with the created subscription', async () => {
    (resolveRenewal as jest.Mock).mockResolvedValue({
      subscription: { id: 3 },
    });

    const res = await request(app)
      .post(`/api/appointments/${id1}/resolve-renewal`)
      .send(subscriptionData);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ id: expect.any(String) });
  });

  it('forwards the acting user to the service', async () => {
    (resolveRenewal as jest.Mock).mockResolvedValue({
      subscription: { id: 3 },
    });

    await request(app).post(`/api/appointments/${id1}/resolve-renewal`).send(subscriptionData);

    expect(resolveRenewal).toHaveBeenCalledWith(1, expect.anything(), {
      userId: 9,
      username: 'ada',
    });
  });

  it('returns 404 when the appointment does not exist, has no linked client, or is already resolved', async () => {
    (resolveRenewal as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/appointments/${id999}/resolve-renewal`)
      .send(subscriptionData);

    expect(res.status).toBe(404);
  });

  it('returns 409 when the client already has a pending unpaid renewal', async () => {
    (resolveRenewal as jest.Mock).mockResolvedValue({
      subscription: null,
      reason: 'already_pending',
    });

    const res = await request(app)
      .post(`/api/appointments/${id1}/resolve-renewal`)
      .send(subscriptionData);

    expect(res.status).toBe(409);
  });
});
