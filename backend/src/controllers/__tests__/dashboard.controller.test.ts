import request from 'supertest';
import app from '../../app';
import dashboardService from '../../services/dashboard.service';

jest.mock('../../services/dashboard.service');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockSummary = {
  active: { today: 12, tomorrow: 15 },
  suspended: { today: 4, tomorrow: 3 },
  deliveriesToday: 9,
  contractEnding: { today: [], tomorrow: [] },
  birthdays: [],
  connections: [],
  menus: {
    today: { date: '2026-06-25', loaded: true },
    tomorrow: { date: '2026-06-26', loaded: false },
  },
};

describe('GET /api/dashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with the dashboard summary', async () => {
    (dashboardService.findSummary as jest.Mock).mockResolvedValue(mockSummary);

    const res = await request(app).get('/api/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockSummary);
  });

  it('returns 500 when the service throws', async () => {
    (dashboardService.findSummary as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/dashboard');

    expect(res.status).toBe(500);
  });
});
