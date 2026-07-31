import request from 'supertest';
import app from '../../app';
import { findBirthdays } from '../../domains/client';
import { countDeliveriesToday } from '../../domains/delivery';
import { findRecent } from '../../domains/login-event';
import { findMenuStatus } from '../../domains/menu';
import { findContractEnding, findSubscriptionCounts } from '../../domains/subscription';
import { findConnections } from '../../domains/user';

jest.mock('../../domains/client');
jest.mock('../../domains/delivery');
jest.mock('../../domains/login-event');
jest.mock('../../domains/menu');
jest.mock('../../domains/subscription');
jest.mock('../../domains/user');
jest.mock('../../database/sequelize', () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock('../../middleware/auth', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const menus = {
  today: { date: '2026-06-25', loaded: true },
  tomorrow: { date: '2026-06-26', loaded: false },
};

const mockSections = () => {
  (findSubscriptionCounts as jest.Mock).mockResolvedValue({
    active: { today: 12, tomorrow: 15 },
    suspended: { today: 4, tomorrow: 3 },
  });
  (countDeliveriesToday as jest.Mock).mockResolvedValue(9);
  (findContractEnding as jest.Mock).mockResolvedValue({ today: [], tomorrow: [] });
  (findBirthdays as jest.Mock).mockResolvedValue([]);
  (findConnections as jest.Mock).mockResolvedValue([]);
  (findMenuStatus as jest.Mock).mockResolvedValue(menus);
};

describe('GET /api/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSections();
  });

  it('returns 200 with every section composed into one summary', async () => {
    const res = await request(app).get('/api/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      active: { today: 12, tomorrow: 15 },
      suspended: { today: 4, tomorrow: 3 },
      deliveriesToday: 9,
      contractEnding: { today: [], tomorrow: [] },
      birthdays: [],
      connections: [],
      menus,
    });
  });

  // The frontend reads this payload key by key, so the shape is part of the contract.
  it('keeps the counts spread ahead of the remaining sections', async () => {
    const res = await request(app).get('/api/dashboard');

    expect(Object.keys(res.body.data)).toEqual([
      'active',
      'suspended',
      'deliveriesToday',
      'contractEnding',
      'birthdays',
      'connections',
      'menus',
    ]);
  });

  it('returns 500 when a section throws', async () => {
    (findBirthdays as jest.Mock).mockRejectedValue(new Error('db error'));

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
    (findRecent as jest.Mock).mockResolvedValue(entries);

    const res = await request(app).get('/api/dashboard/sessions');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(entries);
  });

  it('passes the roles query param to the service as a list', async () => {
    (findRecent as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/dashboard/sessions?roles=kitchen,delivery');

    expect(res.status).toBe(200);
    expect(findRecent).toHaveBeenCalledWith(['kitchen', 'delivery']);
  });

  it('calls the service without roles when the param is absent', async () => {
    (findRecent as jest.Mock).mockResolvedValue([]);

    await request(app).get('/api/dashboard/sessions');

    expect(findRecent).toHaveBeenCalledWith(undefined);
  });

  it('returns 500 when the service throws', async () => {
    (findRecent as jest.Mock).mockRejectedValue(new Error('db error'));

    const res = await request(app).get('/api/dashboard/sessions');

    expect(res.status).toBe(500);
  });
});
