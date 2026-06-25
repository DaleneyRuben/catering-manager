import sequelize from '../../database/sequelize';
import Client from '../../models/Client';
import Subscription from '../../models/Subscription';
import User from '../../models/User';
import menuService from '../menu.service';
import dashboardService from '../dashboard.service';

jest.mock('../menu.service', () => ({
  __esModule: true,
  default: { findByDate: jest.fn() },
}));

jest.mock('../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../../models/Client');
jest.mock('../../models/Plan');
jest.mock('../../models/Subscription');
jest.mock('../../models/User');
jest.mock('../../utils/date', () => ({
  ...jest.requireActual('../../utils/date'),
  appToday: jest.fn(() => '2026-06-25'),
}));

describe('dashboardService.findCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns counts as numbers from string DB values', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      {
        active_today: '12',
        active_tomorrow: '15',
        suspended_today: '4',
        suspended_tomorrow: '3',
        deliveries_today: '9',
      },
    ]);

    const result = await dashboardService.findCounts();

    expect(result).toEqual({
      active: { today: 12, tomorrow: 15 },
      suspended: { today: 4, tomorrow: 3 },
      deliveriesToday: 9,
    });
  });

  it('passes today and the next calendar day as query replacements', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      {
        active_today: '0',
        active_tomorrow: '0',
        suspended_today: '0',
        suspended_tomorrow: '0',
        deliveries_today: '0',
      },
    ]);

    await dashboardService.findCounts();

    const [, options] = (sequelize.query as jest.Mock).mock.calls[0];
    expect(options.replacements).toEqual({ today: '2026-06-25', tomorrow: '2026-06-26' });
  });

  it('propagates db errors', async () => {
    (sequelize.query as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(dashboardService.findCounts()).rejects.toThrow('db error');
  });
});

const makeContractEndingSub = (overrides: Partial<Record<string, unknown>> = {}) => ({
  contractEndDate: '2026-06-25',
  client: { id: 1, name: 'Ana López' },
  plan: { name: 'Reductor' },
  ...overrides,
});

describe('dashboardService.findContractEnding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps name, plan, and date for clients ending today', async () => {
    (Subscription.findAll as jest.Mock).mockImplementation(({ where }) =>
      where.contractEndDate === '2026-06-25'
        ? Promise.resolve([makeContractEndingSub()])
        : Promise.resolve([]),
    );

    const result = await dashboardService.findContractEnding();

    expect(result.today).toEqual([
      { id: 1, name: 'Ana López', plan: 'Reductor', date: '2026-06-25' },
    ]);
    expect(result.tomorrow).toEqual([]);
  });

  it('queries with finalizedAt IS NULL', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await dashboardService.findContractEnding();

    const call = (Subscription.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where.finalizedAt).toEqual({ [Symbol.for('is')]: null });
  });

  it('sorts results alphabetically by name', async () => {
    (Subscription.findAll as jest.Mock).mockImplementation(({ where }) =>
      where.contractEndDate === '2026-06-25'
        ? Promise.resolve([
            makeContractEndingSub({ client: { id: 1, name: 'Zara Gomez' } }),
            makeContractEndingSub({ client: { id: 2, name: 'Ana López' } }),
          ])
        : Promise.resolve([]),
    );

    const result = await dashboardService.findContractEnding();

    expect(result.today.map((p) => p.name)).toEqual(['Ana López', 'Zara Gomez']);
  });
});

describe('dashboardService.findConnections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-06-25T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns all kitchen and delivery users sorted by lastLoginAt desc', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([
      { username: 'Caro', lastLoginAt: new Date('2026-06-25T11:59:00Z') },
      { username: 'Randy', lastLoginAt: new Date('2026-06-25T11:56:00Z') },
    ]);

    const result = await dashboardService.findConnections();

    expect(result).toEqual([
      { username: 'Caro', lastLoginAt: '2026-06-25T11:59:00.000Z', online: true },
      { username: 'Randy', lastLoginAt: '2026-06-25T11:56:00.000Z', online: true },
    ]);
  });

  it('marks online false when the last login was over an hour ago', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([
      { username: 'Randy', lastLoginAt: new Date('2026-06-25T08:14:00Z') },
    ]);

    const result = await dashboardService.findConnections();

    expect(result[0].online).toBe(false);
  });

  it('returns an empty array when no kitchen or delivery user has logged in', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([]);

    const result = await dashboardService.findConnections();

    expect(result).toEqual([]);
  });

  it('queries only kitchen and delivery roles with a non-null lastLoginAt', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([]);

    await dashboardService.findConnections();

    const call = (User.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where.role).toEqual({ [Symbol.for('in')]: ['kitchen', 'delivery'] });
    expect(call.where.lastLoginAt).toEqual({ [Symbol.for('not')]: null });
  });
});

describe('dashboardService.findBirthdays', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps id, name, and dateOfBirth for each client', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Jorge Rengel', dateOfBirth: '1990-06-06' },
    ]);

    const result = await dashboardService.findBirthdays();

    expect(result).toEqual([
      { id: 1, name: 'Jorge Rengel', dateOfBirth: '1990-06-06', isToday: false },
    ]);
  });

  it('marks isToday true when the month and day match today', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Pablo Villarroel', dateOfBirth: '1999-06-25' },
    ]);

    const result = await dashboardService.findBirthdays();

    expect(result[0].isToday).toBe(true);
  });

  it('filters by the current month via EXTRACT', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    await dashboardService.findBirthdays();

    const call = (Client.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where).toBeDefined();
  });

  it('orders by day of month ascending', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    await dashboardService.findBirthdays();

    const call = (Client.findAll as jest.Mock).mock.calls[0][0];
    expect(call.order).toBeDefined();
  });
});

const fullMenu = {
  breakfast: 'Avena',
  morningSnack: 'Fruta',
  salad: 'Ensalada',
  lunch: 'Pollo',
  afternoonSnack: 'Yogurt',
  dinner: 'Sopa',
  juice: 'Limonada',
};

describe('dashboardService.findMenus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks loaded true when all 7 meal fields are filled', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(fullMenu);

    const result = await dashboardService.findMenus();

    expect(result.today.loaded).toBe(true);
  });

  it('marks loaded false when any meal field is missing', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue({ ...fullMenu, dinner: null });

    const result = await dashboardService.findMenus();

    expect(result.today.loaded).toBe(false);
  });

  it('marks loaded false when no menu exists for the date', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(null);

    const result = await dashboardService.findMenus();

    expect(result.today.loaded).toBe(false);
    expect(result.tomorrow.loaded).toBe(false);
  });

  it('includes the date for each day', async () => {
    (menuService.findByDate as jest.Mock).mockResolvedValue(null);

    const result = await dashboardService.findMenus();

    expect(result.today.date).toBe('2026-06-25');
    expect(result.tomorrow.date).toBe('2026-06-26');
  });
});

describe('dashboardService.findSummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('composes all sections into one response', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      {
        active_today: '12',
        active_tomorrow: '15',
        suspended_today: '4',
        suspended_tomorrow: '3',
        deliveries_today: '9',
      },
    ]);
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Client.findAll as jest.Mock).mockResolvedValue([]);
    (User.findAll as jest.Mock).mockResolvedValue([]);
    (menuService.findByDate as jest.Mock).mockResolvedValue(null);

    const result = await dashboardService.findSummary();

    expect(result).toEqual({
      active: { today: 12, tomorrow: 15 },
      suspended: { today: 4, tomorrow: 3 },
      deliveriesToday: 9,
      contractEnding: { today: [], tomorrow: [] },
      birthdays: [],
      connections: [],
      menus: {
        today: { date: '2026-06-25', loaded: false },
        tomorrow: { date: '2026-06-26', loaded: false },
      },
    });
  });
});
