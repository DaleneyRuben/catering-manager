import request from 'supertest';
import app from '../../app';
import clientService from '../../services/client.service';

jest.mock('../../services/client.service');

const mockClient = {
  id: 1,
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Zone A',
  underlyingDiseases: ['diabetes'],
  allergies: ['gluten'],
};

const validPayload = {
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Zone A',
  underlyingDiseases: ['diabetes'],
  allergies: ['gluten'],
};

describe('GET /api/clients', () => {
  it('returns 200 with list of clients', async () => {
    (clientService.findAll as jest.Mock).mockResolvedValue([mockClient]);

    const res = await request(app).get('/api/clients');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ name: 'John Doe' });
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

    const res = await request(app).get('/api/clients/1');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 1, name: 'John Doe' });
  });

  it('returns 404 when client not found', async () => {
    (clientService.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/clients/999');

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    (clientService.findById as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/clients/1');

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

  it('returns 500 when service throws', async () => {
    (clientService.create as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).post('/api/clients').send(validPayload);

    expect(res.status).toBe(500);
  });
});
