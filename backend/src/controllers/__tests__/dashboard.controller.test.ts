import request from 'supertest';
import app from '../../app';
import * as dashboardService from '../../services/dashboard';
import * as loginEventService from '../../services/login-event';

jest.mock('../../services/dashboard');
jest.mock('../../services/login-event');
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

describe('GET /api/dashboard/sessions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with the recent login entries', async () => {
    const entries = [
      {
        username: 'merlyn',
        role: 'kitchen',
        deviceType: 'mobile',
        os: 'Android',
        browser: 'Chrome 149',
        createdAt: '2026-07-04T10:29:00.000Z',
      },
    ];
    (loginEventService.findRecent as jest.Mock).mockResolvedValue(entries);

    const res = await request(app).get('/api/dashboard/sessions');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(entries);
  });

  it('passes the roles query param to the service as a list', async () => {
    (loginEventService.findRecent as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/dashboard/sessions?roles=kitchen,delivery');

    expect(res.status).toBe(200);
    expect(loginEventService.findRecent).toHaveBeenCalledWith(['kitchen', 'delivery']);
  });

  it('calls the service without roles when the param is absent', async () => {
    (loginEventService.findRecent as jest.Mock).mockResolvedValue([]);

    await request(app).get('/api/dashboard/sessions');

    expect(loginEventService.findRecent).toHaveBeenCalledWith(undefined);
  });

  it('returns 500 when the service throws', async () => {
    (loginEventService.findRecent as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/dashboard/sessions');

    expect(res.status).toBe(500);
  });
});
