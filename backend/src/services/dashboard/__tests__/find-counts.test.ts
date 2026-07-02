import sequelize from '../../../database/sequelize';
import { findCounts } from '../find-counts';

jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockAppToday = jest.fn(() => '2026-06-25');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => mockAppToday(),
}));

describe('findCounts', () => {
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

    const result = await findCounts();

    expect(result).toEqual({
      active: { today: 12, tomorrow: 15 },
      suspended: { today: 4, tomorrow: 3 },
      deliveriesToday: 9,
    });
  });

  it('shifts to monday/tuesday when today is saturday', async () => {
    mockAppToday.mockReturnValueOnce('2026-06-27');
    (sequelize.query as jest.Mock).mockResolvedValue([
      {
        active_today: '0',
        active_tomorrow: '0',
        suspended_today: '0',
        suspended_tomorrow: '0',
        deliveries_today: '0',
      },
    ]);

    await findCounts();

    const [, options] = (sequelize.query as jest.Mock).mock.calls[0];
    expect(options.replacements).toEqual({ today: '2026-06-29', tomorrow: '2026-06-30' });
  });

  it('excludes soft-deleted clients via deletedAt IS NULL in raw SQL', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      {
        active_today: '0',
        active_tomorrow: '0',
        suspended_today: '0',
        suspended_tomorrow: '0',
        deliveries_today: '0',
      },
    ]);

    await findCounts();

    const [sql] = (sequelize.query as jest.Mock).mock.calls[0];
    expect(sql).toContain('"deletedAt" IS NULL');
  });

  it('propagates db errors', async () => {
    (sequelize.query as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(findCounts()).rejects.toThrow('db error');
  });
});
