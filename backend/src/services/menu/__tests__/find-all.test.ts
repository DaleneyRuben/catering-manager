import { Op } from 'sequelize';
import Menu from '../../../models/Menu';
import { findAll } from '../find-all';

jest.mock('../../../models/Menu');
jest.mock('../../../utils/date', () => ({
  getCurrentMenuWeek: jest.fn(() => ({ start: '2026-06-15', end: '2026-06-19' })),
}));

const makeMenu = (overrides = {}) => ({
  id: 1,
  date: '2026-06-16',
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('findAll', () => {
  it('returns menus for the current week ordered by date ascending', async () => {
    const menus = [
      makeMenu({ id: 1, date: '2026-06-15' }),
      makeMenu({ id: 2, date: '2026-06-16' }),
    ];
    (Menu.findAll as jest.Mock).mockResolvedValue(menus);

    const result = await findAll();

    expect(Menu.findAll).toHaveBeenCalledWith({
      where: { date: { [Op.between]: ['2026-06-15', '2026-06-19'] } },
      order: [['date', 'ASC']],
    });
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no menus exist for the current week', async () => {
    (Menu.findAll as jest.Mock).mockResolvedValue([]);

    const result = await findAll();

    expect(result).toEqual([]);
  });
});
