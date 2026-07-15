import request from 'supertest';
import app from '../../app';
import * as productionService from '../../services/production';
import { encodeId } from '../../utils/sqids';

jest.mock('../../services/production');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mockGetCurrentMenuWeek = jest.fn(() => ({ start: '2026-06-29', end: '2026-07-03' }));
jest.mock('../../utils/date', () => ({
  ...jest.requireActual('../../utils/date'),
  getCurrentMenuWeek: () => mockGetCurrentMenuWeek(),
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

describe('GET /api/production/weekly-counts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the counts for the requested week offset', async () => {
    (productionService.findWeeklyCounts as jest.Mock).mockResolvedValue(mockWeeklyCounts);

    const res = await request(app).get('/api/production/weekly-counts').query({ offset: '1' });

    expect(res.status).toBe(200);
    expect(productionService.findWeeklyCounts).toHaveBeenCalledWith(1);
    expect(res.body.data).toEqual(mockWeeklyCounts);
  });

  it('rejects a missing offset with 400', async () => {
    const res = await request(app).get('/api/production/weekly-counts');

    expect(res.status).toBe(400);
    expect(productionService.findWeeklyCounts).not.toHaveBeenCalled();
  });

  it.each(['-1', '3', 'abc', '1.5'])('rejects offset %s with 400', async (offset) => {
    const res = await request(app).get('/api/production/weekly-counts').query({ offset });

    expect(res.status).toBe(400);
    expect(productionService.findWeeklyCounts).not.toHaveBeenCalled();
  });
});

describe('GET /api/production/day', () => {
  const mockDayClients = {
    date: '2026-07-01',
    count: 1,
    clients: [{ id: 7, name: 'Ana Rojas', phoneNumber: '70123456', deliveryZone: 'Centro' }],
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns the active clients for a weekday inside the window', async () => {
    (productionService.findDayClients as jest.Mock).mockResolvedValue(mockDayClients);

    const res = await request(app).get('/api/production/day').query({ date: '2026-07-01' });

    expect(res.status).toBe(200);
    expect(productionService.findDayClients).toHaveBeenCalledWith('2026-07-01');
    expect(res.body.data.clients).toEqual([
      { id: encodeId(7), name: 'Ana Rojas', phoneNumber: '70123456', deliveryZone: 'Centro' },
    ]);
  });

  it.each([undefined, '01/07/2026', '2026-13-40'])(
    'rejects invalid date %s with 400',
    async (date) => {
      const res = await request(app)
        .get('/api/production/day')
        .query(date === undefined ? {} : { date });

      expect(res.status).toBe(400);
      expect(productionService.findDayClients).not.toHaveBeenCalled();
    },
  );

  it('rejects a weekend date with 400', async () => {
    const res = await request(app).get('/api/production/day').query({ date: '2026-07-04' });

    expect(res.status).toBe(400);
    expect(productionService.findDayClients).not.toHaveBeenCalled();
  });

  it.each(['2026-06-26', '2026-07-20'])(
    'rejects %s outside the current-to-plus-2-weeks window with 400',
    async (date) => {
      const res = await request(app).get('/api/production/day').query({ date });

      expect(res.status).toBe(400);
      expect(productionService.findDayClients).not.toHaveBeenCalled();
    },
  );

  it('accepts the last day of the window', async () => {
    (productionService.findDayClients as jest.Mock).mockResolvedValue({
      date: '2026-07-17',
      count: 0,
      clients: [],
    });

    const res = await request(app).get('/api/production/day').query({ date: '2026-07-17' });

    expect(res.status).toBe(200);
    expect(productionService.findDayClients).toHaveBeenCalledWith('2026-07-17');
  });
});
