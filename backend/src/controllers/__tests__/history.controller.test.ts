import request from 'supertest';
import app from '../../app';
import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import { encodeId } from '../../utils/sqids';

jest.mock('../../models/Client');
jest.mock('../../models/ClientHistory');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const id42 = encodeId(42);
const id99 = encodeId(99);
const id404 = encodeId(404);

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
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with the client history ordered by date descending', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 42 });
    (ClientHistory.findAll as jest.Mock).mockResolvedValue(mockHistory);

    const res = await request(app).get(`/api/clients/${id42}/history`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(ClientHistory.findAll).toHaveBeenCalledWith({
      where: { clientId: 42 },
      order: [['occurredAt', 'DESC']],
    });
  });

  it('returns 200 with empty array when client exists but has no history', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 99 });
    (ClientHistory.findAll as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get(`/api/clients/${id99}/history`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 404 when the client does not exist', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/clients/${id404}/history`);

    expect(res.status).toBe(404);
    expect(ClientHistory.findAll).not.toHaveBeenCalled();
  });

  it('returns 500 when the database throws', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ id: 42 });
    (ClientHistory.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get(`/api/clients/${id42}/history`);

    expect(res.status).toBe(500);
  });
});
