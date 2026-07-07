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

const mockWeeklyCounts = {
  weekStart: '2026-06-29',
  weekEnd: '2026-07-03',
  days: [
    { date: '2026-06-29', count: 10 },
    { date: '2026-06-30', count: 11 },
    { date: '2026-07-01', count: 12 },
    { date: '2026-07-02', count: 9 },
    { date: '2026-07-03', count: 8 },
  ],
};

describe('GET /api/production', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with the production summary merged with weekly counts', async () => {
    (productionService.findGroups as jest.Mock).mockResolvedValue(mockSummary);
    (productionService.findWeeklyCounts as jest.Mock).mockResolvedValue(mockWeeklyCounts);

    const res = await request(app).get('/api/production');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ...mockSummary, weeklyCounts: mockWeeklyCounts });
  });

  it('returns 500 when the groups service throws', async () => {
    (productionService.findGroups as jest.Mock).mockRejectedValue(new Error('db error'));
    (productionService.findWeeklyCounts as jest.Mock).mockResolvedValue(mockWeeklyCounts);

    const res = await request(app).get('/api/production');

    expect(res.status).toBe(500);
  });

  it('returns 500 when the weekly counts service throws', async () => {
    (productionService.findGroups as jest.Mock).mockResolvedValue(mockSummary);
    (productionService.findWeeklyCounts as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/production');

    expect(res.status).toBe(500);
  });
});
