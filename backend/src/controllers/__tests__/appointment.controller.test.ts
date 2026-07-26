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

beforeEach(() => jest.clearAllMocks());

const validPayload = {
  name: 'Ana Pérez',
  phone: '71234567',
  date: '2026-08-03',
  time: '09:00',
};

describe('POST /api/appointments', () => {
  it('returns 201 with the created appointment', async () => {
    (evaluationService.createAppointment as jest.Mock).mockResolvedValue({
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
    expect(evaluationService.createAppointment).not.toHaveBeenCalled();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ ...validPayload, name: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (evaluationService.createAppointment as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post('/api/appointments').send(validPayload);

    expect(res.status).toBe(500);
  });

  it('decodes clientId and passes it to the service in existing-client mode', async () => {
    (evaluationService.createAppointment as jest.Mock).mockResolvedValue({
      id: 1,
      clientId: 5,
      name: 'Fernando Daleney',
      phone: '76637732',
      date: '2026-08-03',
      time: '09:00',
    });

    const res = await request(app)
      .post('/api/appointments')
      .send({ clientId: encodeId(5), date: '2026-08-03', time: '09:00' });

    expect(res.status).toBe(201);
    expect(evaluationService.createAppointment).toHaveBeenCalledWith({
      clientId: 5,
      date: '2026-08-03',
      time: '09:00',
    });
  });

  it('returns 404 when the linked client does not exist', async () => {
    (evaluationService.createAppointment as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/appointments')
      .send({ clientId: encodeId(999), date: '2026-08-03', time: '09:00' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when both clientId and name/phone are provided', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ clientId: encodeId(5), ...validPayload });

    expect(res.status).toBe(400);
    expect(evaluationService.createAppointment).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/appointments/:id', () => {
  it('returns 200 with the updated appointment', async () => {
    (evaluationService.updateAppointment as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Nuevo nombre',
    });

    const res = await request(app).patch(`/api/appointments/${id1}`).send({ name: 'Nuevo nombre' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Nuevo nombre' });
  });

  it('returns 404 when the appointment does not exist', async () => {
    (evaluationService.updateAppointment as jest.Mock).mockResolvedValue(null);

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
    (evaluationService.updateAppointment as jest.Mock).mockResolvedValue({
      id: 1,
      subscriptionId: 3,
    });

    const res = await request(app)
      .patch(`/api/appointments/${id1}`)
      .send({ subscriptionId: encodeId(3) });

    expect(res.status).toBe(200);
    expect(evaluationService.updateAppointment).toHaveBeenCalledWith(1, { subscriptionId: 3 });
  });
});

describe('DELETE /api/appointments/:id', () => {
  it('returns 200 when the appointment is cancelled', async () => {
    (evaluationService.cancelAppointment as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await request(app).delete(`/api/appointments/${id1}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when the appointment does not exist or is already converted', async () => {
    (evaluationService.cancelAppointment as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(`/api/appointments/${id999}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/appointments/pending', () => {
  it('returns 200 with the pending appointments', async () => {
    (evaluationService.findPendingForAdmin as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/api/appointments/pending');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/appointments/:id', () => {
  it('returns 200 with the appointment', async () => {
    (evaluationService.findById as jest.Mock).mockResolvedValue({
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
    (evaluationService.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/appointments/${id999}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/appointments/nutritionist', () => {
  it('returns 200 with all appointments', async () => {
    (evaluationService.findForNutritionist as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get('/api/appointments/nutritionist');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
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
    (evaluationService.convertAppointment as jest.Mock).mockResolvedValue({
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
    (evaluationService.convertAppointment as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/appointments/${id999}/convert`)
      .send({ client: clientData, subscription: subscriptionData });

    expect(res.status).toBe(404);
  });

  it('forwards the acting user to the service', async () => {
    (evaluationService.convertAppointment as jest.Mock).mockResolvedValue({
      client: { id: 7 },
      subscription: { id: 3 },
    });

    await request(app)
      .post(`/api/appointments/${id1}/convert`)
      .send({ client: clientData, subscription: subscriptionData });

    expect(evaluationService.convertAppointment).toHaveBeenCalledWith(
      1,
      expect.anything(),
      expect.anything(),
      { userId: 9, username: 'ada' },
    );
  });

  it('returns 400 when client data is invalid', async () => {
    const res = await request(app)
      .post(`/api/appointments/${id1}/convert`)
      .send({ client: { ...clientData, name: '' }, subscription: subscriptionData });

    expect(res.status).toBe(400);
  });
});
