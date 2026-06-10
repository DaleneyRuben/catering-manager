import request from 'supertest';
import app from '../../app';
import ClientHistory from '../../models/ClientHistory';
import { encodeId } from '../../utils/sqids';

jest.mock('../../models/ClientHistory');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));

const id42 = encodeId(42);
const id99 = encodeId(99);

const mockHistory = [
  {
    id: 1,
    clientId: 42,
    event: 'plan_assigned',
    occurredAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 2,
    clientId: 42,
    event: 'paused',
    occurredAt: '2026-05-15T10:00:00Z',
  },
];

describe('GET /api/clients/:id/history', () => {
  it('returns 200 with the client history ordered by date descending', async () => {
    (ClientHistory.findAll as jest.Mock).mockResolvedValue(mockHistory);

    const res = await request(app).get(`/api/clients/${id42}/history`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(ClientHistory.findAll).toHaveBeenCalledWith({
      where: { clientId: 42 },
      order: [['occurredAt', 'DESC']],
    });
  });

  it('returns 200 with empty array when client has no history', async () => {
    (ClientHistory.findAll as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get(`/api/clients/${id99}/history`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 500 when the database throws', async () => {
    (ClientHistory.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get(`/api/clients/${id42}/history`);

    expect(res.status).toBe(500);
  });
});
