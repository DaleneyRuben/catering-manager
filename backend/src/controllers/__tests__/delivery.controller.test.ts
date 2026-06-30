import request from 'supertest';
import app from '../../app';
import * as deliveryService from '../../services/delivery';

jest.mock('../../services/delivery');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockRoute = {
  '2026-06-23': { zones: [] },
  '2026-06-24': { zones: [] },
};

describe('GET /api/delivery', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with the route keyed by date', async () => {
    (deliveryService.findRoute as jest.Mock).mockResolvedValue(mockRoute);

    const res = await request(app).get('/api/delivery');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockRoute);
  });

  it('returns 500 when the service throws', async () => {
    (deliveryService.findRoute as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/delivery');

    expect(res.status).toBe(500);
  });
});
