import { Op } from 'sequelize';
import Menu from '../../models/Menu';
import menuService from '../menu/menu.service';

jest.mock('../../models/Menu');
jest.mock('../../utils/date', () => ({
  getCurrentMenuWeek: jest.fn(() => ({ start: '2026-06-15', end: '2026-06-19' })),
}));

const makeMenu = (overrides = {}) => ({
  id: 1,
  date: '2026-06-16',
  breakfast: 'Queque de platano',
  morningSnack: null,
  salad: null,
  lunch: null,
  afternoonSnack: null,
  dinner: null,
  juice: null,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('menuService.upsert', () => {
  it('creates a new menu when none exists for the date', async () => {
    (Menu.findOne as jest.Mock).mockResolvedValue(null);
    const created = makeMenu();
    (Menu.create as jest.Mock).mockResolvedValue(created);
    (Menu.destroy as jest.Mock).mockResolvedValue(undefined);

    const result = await menuService.upsert('2026-06-16', { breakfast: 'Queque de platano' });

    expect(Menu.create).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-06-16', breakfast: 'Queque de platano' }),
    );
    expect(result).toMatchObject({ date: '2026-06-16', breakfast: 'Queque de platano' });
  });

  it('updates existing menu when one already exists for the date', async () => {
    const mockInstance = {
      ...makeMenu({ breakfast: 'Old dish' }),
      update: jest.fn().mockResolvedValue(makeMenu({ breakfast: 'New dish' })),
    };
    (Menu.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Menu.destroy as jest.Mock).mockResolvedValue(undefined);

    const result = await menuService.upsert('2026-06-16', { breakfast: 'New dish' });

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ breakfast: 'New dish' }),
    );
    expect(result).toMatchObject({ breakfast: 'New dish' });
  });

  it('prunes menus outside the current week after upsert', async () => {
    (Menu.findOne as jest.Mock).mockResolvedValue(null);
    (Menu.create as jest.Mock).mockResolvedValue(makeMenu());
    (Menu.destroy as jest.Mock).mockResolvedValue(undefined);

    await menuService.upsert('2026-06-16', { breakfast: 'Queque' });

    expect(Menu.destroy).toHaveBeenCalledWith({
      where: {
        date: { [Op.notBetween]: ['2026-06-15', '2026-06-19'] },
      },
    });
  });

  it('propagates db errors', async () => {
    (Menu.findOne as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(menuService.upsert('2026-06-16', {})).rejects.toThrow('db error');
  });
});

describe('menuService.findByDate', () => {
  it('returns the menu for the given date', async () => {
    const menu = makeMenu();
    (Menu.findOne as jest.Mock).mockResolvedValue(menu);

    const result = await menuService.findByDate('2026-06-16');

    expect(result).toMatchObject({ date: '2026-06-16' });
  });

  it('returns null when no menu exists for the date', async () => {
    (Menu.findOne as jest.Mock).mockResolvedValue(null);

    const result = await menuService.findByDate('2026-06-16');

    expect(result).toBeNull();
  });
});

describe('menuService.findAll', () => {
  it('returns menus for the current week ordered by date ascending', async () => {
    const menus = [
      makeMenu({ id: 1, date: '2026-06-15' }),
      makeMenu({ id: 2, date: '2026-06-16' }),
    ];
    (Menu.findAll as jest.Mock).mockResolvedValue(menus);

    const result = await menuService.findAll();

    expect(Menu.findAll).toHaveBeenCalledWith({
      where: { date: { [Op.between]: ['2026-06-15', '2026-06-19'] } },
      order: [['date', 'ASC']],
    });
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no menus exist for the current week', async () => {
    (Menu.findAll as jest.Mock).mockResolvedValue([]);

    const result = await menuService.findAll();

    expect(result).toEqual([]);
  });
});
