import sequelize from '../../../database/sequelize';
import Client from '../../../models/Client';
import Subscription from '../../../models/Subscription';
import User from '../../../models/User';
import { findByDate } from '../../menu/find-by-date';
import { findSummary } from '../find-summary';

jest.mock('../../menu/find-by-date', () => ({
  findByDate: jest.fn(),
}));
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../../../models/Client');
jest.mock('../../../models/Plan');
jest.mock('../../../models/Subscription');
jest.mock('../../../models/User');

jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-25'),
}));

describe('findSummary', () => {
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
    (findByDate as jest.Mock).mockResolvedValue(null);

    const result = await findSummary();

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
