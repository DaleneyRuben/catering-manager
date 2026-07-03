import request from 'supertest';
import app from '../../app';
import * as productionService from '../../services/production';

jest.mock('../../services/production');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockSummary = {
  date: '2026-07-02',
  isDeliveryDay: true,
  total: 3,
  groups: {
    juice: ['Ana Flores'],
    lunchOnly: ['Ana Flores'],
    lunchAndDinner: ['Carlos Ríos'],
    full: ['María Torres'],
  },
};

describe('GET /api/production', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with the production summary', async () => {
    (productionService.findGroups as jest.Mock).mockResolvedValue(mockSummary);

    const res = await request(app).get('/api/production');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockSummary);
  });

  it('returns 500 when the service throws', async () => {
    (productionService.findGroups as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/production');

    expect(res.status).toBe(500);
  });
});
