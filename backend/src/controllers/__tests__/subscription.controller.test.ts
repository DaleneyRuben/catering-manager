import request from 'supertest';
import app from '../../app';
import subscriptionService from '../../services/subscription.service';

jest.mock('../../services/subscription.service');

const mockSubscription = {
  id: 1,
  clientId: 1,
  planId: 2,
  contractDate: '2026-05-23',
  startDate: '2026-05-26',
  contractEndDate: '2026-06-22',
};

const validPayload = {
  planId: 2,
  startDate: '2026-05-26',
  contractDate: '2026-05-23',
  contractEndDate: '2026-06-22',
};

describe('POST /api/clients/:clientId/subscriptions', () => {
  it('returns 201 with created subscription', async () => {
    (subscriptionService.create as jest.Mock).mockResolvedValue(mockSubscription);

    const res = await request(app).post('/api/clients/1/subscriptions').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ clientId: 1, planId: 2 });
  });

  it('returns 404 when client does not exist', async () => {
    (subscriptionService.create as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post('/api/clients/999/subscriptions').send(validPayload);

    expect(res.status).toBe(404);
  });

  it('returns 400 when planId is missing', async () => {
    const res = await request(app)
      .post('/api/clients/1/subscriptions')
      .send({ ...validPayload, planId: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when startDate format is invalid', async () => {
    const res = await request(app)
      .post('/api/clients/1/subscriptions')
      .send({ ...validPayload, startDate: '26-05-2026' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when contractDate does not match', async () => {
    (subscriptionService.create as jest.Mock).mockRejectedValue(
      Object.assign(new Error('contractDate must be today'), { statusCode: 400 }),
    );

    const res = await request(app)
      .post('/api/clients/1/subscriptions')
      .send({ ...validPayload, contractDate: '2026-01-01' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when contractEndDate does not match', async () => {
    (subscriptionService.create as jest.Mock).mockRejectedValue(
      Object.assign(new Error('contractEndDate must be ...'), { statusCode: 400 }),
    );

    const res = await request(app)
      .post('/api/clients/1/subscriptions')
      .send({ ...validPayload, contractEndDate: '2026-12-31' });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (subscriptionService.create as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post('/api/clients/1/subscriptions').send(validPayload);

    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/clients/:clientId/subscriptions/:id', () => {
  it('returns 200 with updated subscription', async () => {
    const updated = { ...mockSubscription, contractEndDate: '2026-06-30' };
    (subscriptionService.update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/clients/1/subscriptions/1')
      .send({ contractEndDate: '2026-06-30' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ contractEndDate: '2026-06-30' });
  });

  it('returns 404 when subscription not found', async () => {
    (subscriptionService.update as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/clients/1/subscriptions/999')
      .send({ contractEndDate: '2026-06-30' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when date format is invalid', async () => {
    const res = await request(app)
      .patch('/api/clients/1/subscriptions/1')
      .send({ contractEndDate: '30-06-2026' });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (subscriptionService.update as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app)
      .patch('/api/clients/1/subscriptions/1')
      .send({ contractEndDate: '2026-06-30' });

    expect(res.status).toBe(500);
  });
});
