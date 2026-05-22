import request from 'supertest';
import app from '../../app';
import planService from '../../services/plan.service';

jest.mock('../../services/plan.service');

const mockPlan = {
  id: 1,
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  description: 'Three meals a day',
};

const validPayload = {
  name: 'Full Plan',
  meals: ['breakfast', 'lunch', 'dinner'],
  description: 'Three meals a day',
};

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

    const res = await request(app).get('/api/plans/1');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 1, name: 'Full Plan' });
  });

  it('returns 404 when plan not found', async () => {
    (planService.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/plans/999');

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (planService.findById as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/plans/1');

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

describe('PATCH /api/plans/:id', () => {
  it('returns 200 with updated plan', async () => {
    const updated = { ...mockPlan, name: 'Updated Plan' };
    (planService.update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app).patch('/api/plans/1').send({ name: 'Updated Plan' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Updated Plan' });
  });

  it('returns 404 when plan not found', async () => {
    (planService.update as jest.Mock).mockResolvedValue(null);

    const res = await request(app).patch('/api/plans/999').send({ name: 'Updated Plan' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when meal value is invalid', async () => {
    const res = await request(app)
      .patch('/api/plans/1')
      .send({ meals: ['breakfast', 'brunch'] });

    expect(res.status).toBe(400);
  });

  it('returns 500 when service throws', async () => {
    (planService.update as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).patch('/api/plans/1').send({ name: 'Updated Plan' });

    expect(res.status).toBe(500);
  });
});
