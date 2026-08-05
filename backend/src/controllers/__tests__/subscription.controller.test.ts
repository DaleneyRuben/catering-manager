import type { Request } from 'express';
import request from 'supertest';
import app from '../../app';
import { create, deleteUpcomingSubscription, update } from '../../domains/subscription';
import { encodeId } from '../../utils/sqids';
import { ConflictError } from '../../utils/errors';

jest.mock('../../domains/subscription');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req: Request, _res: unknown, next: () => void) => {
    req.user = { userId: 9, username: 'ada', role: 'admin' };
    next();
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const id1 = encodeId(1);
const id2 = encodeId(2);
const id999 = encodeId(999);

const mockSubscription = {
  id: 1,
  clientId: 1,
  planId: 2,
  contractDate: '2026-05-23',
  startDate: '2026-05-26',
  contractEndDate: '2026-06-22',
};

const validPayload = {
  planId: id2,
  startDate: '2026-05-26',
  contractDate: '2026-05-23',
  duration: 20,
  price: 1200,
};

describe('POST /api/clients/:clientId/subscriptions', () => {
  it('returns 201 with created subscription', async () => {
    (create as jest.Mock).mockResolvedValue(mockSubscription);

    const res = await request(app).post(`/api/clients/${id1}/subscriptions`).send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ clientId: id1, planId: id2 });
  });

  it('forwards the acting user to the service', async () => {
    (create as jest.Mock).mockResolvedValue(mockSubscription);

    await request(app).post(`/api/clients/${id1}/subscriptions`).send(validPayload);

    expect(create).toHaveBeenCalledWith(1, expect.anything(), {
      userId: 9,
      username: 'ada',
    });
  });

  it('returns 404 when client does not exist', async () => {
    (create as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post(`/api/clients/${id999}/subscriptions`).send(validPayload);

    expect(res.status).toBe(404);
  });

  it('returns 400 when planId is missing', async () => {
    const res = await request(app)
      .post(`/api/clients/${id1}/subscriptions`)
      .send({ ...validPayload, planId: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when startDate format is invalid', async () => {
    const res = await request(app)
      .post(`/api/clients/${id1}/subscriptions`)
      .send({ ...validPayload, startDate: '26-05-2026' });

    expect(res.status).toBe(400);
  });

  it('accepts a past contractDate', async () => {
    (create as jest.Mock).mockResolvedValue({
      id: 1,
      clientId: 1,
      planId: 2,
    });

    const res = await request(app)
      .post(`/api/clients/${id1}/subscriptions`)
      .send({ ...validPayload, contractDate: '2026-01-01' });

    expect(res.status).toBe(201);
  });

  it('returns 400 when startDate is a Saturday', async () => {
    const res = await request(app)
      .post(`/api/clients/${id1}/subscriptions`)
      .send({ ...validPayload, startDate: '2026-06-13' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when startDate is a Sunday', async () => {
    const res = await request(app)
      .post(`/api/clients/${id1}/subscriptions`)
      .send({ ...validPayload, startDate: '2026-06-14' });

    expect(res.status).toBe(400);
  });

  it('accepts a weekday startDate', async () => {
    (create as jest.Mock).mockResolvedValue({
      id: 1,
      clientId: 1,
      planId: 2,
    });

    const res = await request(app)
      .post(`/api/clients/${id1}/subscriptions`)
      .send({ ...validPayload, startDate: '2026-06-16' });

    expect(res.status).toBe(201);
  });

  it('returns 500 when service throws', async () => {
    (create as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post(`/api/clients/${id1}/subscriptions`).send(validPayload);

    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/clients/:clientId/subscriptions/:id', () => {
  it('returns 200 with updated subscription', async () => {
    const updated = { ...mockSubscription, contractEndDate: '2026-06-30' };
    (update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id1}`)
      .send({ contractEndDate: '2026-06-30' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ contractEndDate: '2026-06-30' });
  });

  it('returns 404 when subscription not found', async () => {
    (update as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id999}`)
      .send({ contractEndDate: '2026-06-30' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when date format is invalid', async () => {
    const res = await request(app)
      .patch('/api/clients/1/subscriptions/1')
      .send({ contractEndDate: '30-06-2026' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when startDate is a weekend', async () => {
    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id1}`)
      .send({ startDate: '2026-06-13' });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (update as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id1}`)
      .send({ contractEndDate: '2026-06-30' });

    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/clients/:clientId/subscriptions/:id', () => {
  it('returns 200 with the deleted subscription', async () => {
    (deleteUpcomingSubscription as jest.Mock).mockResolvedValue(mockSubscription);

    const res = await request(app).delete(`/api/clients/${id1}/subscriptions/upcoming/${id1}`);

    expect(res.status).toBe(200);
    expect(deleteUpcomingSubscription).toHaveBeenCalledWith(1, 1, {
      userId: 9,
      username: 'ada',
    });
  });

  it('returns 404 when the subscription does not exist', async () => {
    (deleteUpcomingSubscription as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(`/api/clients/${id1}/subscriptions/upcoming/${id999}`);

    expect(res.status).toBe(404);
  });

  it('returns 409 with the message when the subscription cannot be deleted', async () => {
    (deleteUpcomingSubscription as jest.Mock).mockRejectedValue(
      new ConflictError('Solo puedes eliminar una renovación que aún no ha empezado.'),
    );

    const res = await request(app).delete(`/api/clients/${id1}/subscriptions/upcoming/${id1}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Solo puedes eliminar una renovación que aún no ha empezado.');
  });

  it('returns 500 when service throws', async () => {
    (deleteUpcomingSubscription as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).delete(`/api/clients/${id1}/subscriptions/upcoming/${id1}`);

    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/clients/:clientId/subscriptions/:id with suspendedDates', () => {
  it('returns 200 when suspendedDates is updated', async () => {
    const updated = { ...mockSubscription, suspendedDates: ['2026-06-10'] };
    (update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id1}`)
      .send({ suspendedDates: ['2026-06-10'] });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ suspendedDates: ['2026-06-10'] }),
      { userId: 9, username: 'ada' },
    );
  });

  it('returns 400 when a suspension date has invalid format', async () => {
    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id1}`)
      .send({ suspendedDates: ['10-06-2026'] });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/clients/:clientId/subscriptions/:id with specialInstructions', () => {
  it('passes specialInstructions to the service', async () => {
    const updated = { ...mockSubscription, specialInstructions: { salad: 'DAR GRANDES' } };
    (update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id1}`)
      .send({ specialInstructions: { salad: 'DAR GRANDES' } });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ specialInstructions: { salad: 'DAR GRANDES' } }),
      { userId: 9, username: 'ada' },
    );
  });

  it('passes empty object to clear all instructions', async () => {
    const updated = { ...mockSubscription, specialInstructions: {} };
    (update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id1}`)
      .send({ specialInstructions: {} });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ specialInstructions: {} }),
      { userId: 9, username: 'ada' },
    );
  });

  it('returns 400 when specialInstructions value is not a string', async () => {
    const res = await request(app)
      .patch(`/api/clients/${id1}/subscriptions/${id1}`)
      .send({ specialInstructions: { salad: 123 } });

    expect(res.status).toBe(400);
  });
});
