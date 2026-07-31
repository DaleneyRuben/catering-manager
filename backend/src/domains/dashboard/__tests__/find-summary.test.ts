import Client from '../../../models/Client';
import Subscription from '../../../models/Subscription';
import User from '../../../models/User';
import { findByDate } from '../../menu/find-by-date';
import { findSummary } from '../find-summary';

jest.mock('../../menu/find-by-date', () => ({
  findByDate: jest.fn(),
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
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);
    (Client.findAll as jest.Mock).mockResolvedValue([]);
    (User.findAll as jest.Mock).mockResolvedValue([]);
    (findByDate as jest.Mock).mockResolvedValue(null);

    const result = await findSummary();

    expect(result).toEqual({
      active: { today: 0, tomorrow: 0 },
      suspended: { today: 0, tomorrow: 0 },
      deliveriesToday: 0,
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
