import Menu from '../../models/Menu';
import menuService from '../menu.service';

jest.mock('../../models/Menu');

const makeMenu = (overrides = {}) => ({
  id: 1,
  date: '2026-06-06',
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
    (Menu.findAll as jest.Mock).mockResolvedValue([created]);

    const result = await menuService.upsert('2026-06-06', { breakfast: 'Queque de platano' });

    expect(Menu.create).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-06-06', breakfast: 'Queque de platano' }),
    );
    expect(result).toMatchObject({ date: '2026-06-06', breakfast: 'Queque de platano' });
  });

  it('updates existing menu when one already exists for the date', async () => {
    const mockInstance = {
      ...makeMenu({ breakfast: 'Old dish' }),
      update: jest.fn().mockResolvedValue(makeMenu({ breakfast: 'New dish' })),
    };
    (Menu.findOne as jest.Mock).mockResolvedValue(mockInstance);
    (Menu.findAll as jest.Mock).mockResolvedValue([mockInstance]);

    const result = await menuService.upsert('2026-06-06', { breakfast: 'New dish' });

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ breakfast: 'New dish' }),
    );
    expect(result).toMatchObject({ breakfast: 'New dish' });
  });

  it('prunes old menus keeping only the 3 most recent after upsert', async () => {
    const menus = [
      makeMenu({ id: 4, date: '2026-06-06' }),
      makeMenu({ id: 3, date: '2026-06-05' }),
      makeMenu({ id: 2, date: '2026-06-04' }),
      makeMenu({ id: 1, date: '2026-06-03' }),
    ];
    (Menu.findOne as jest.Mock).mockResolvedValue(null);
    (Menu.create as jest.Mock).mockResolvedValue(menus[0]);
    const destroyMock = jest.fn().mockResolvedValue(undefined);
    (Menu.findAll as jest.Mock).mockResolvedValue(
      menus.map((m) => ({ ...m, destroy: destroyMock })),
    );

    await menuService.upsert('2026-06-06', { breakfast: 'Queque' });

    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it('does not prune when 3 or fewer menus exist', async () => {
    const menus = [
      makeMenu({ id: 3, date: '2026-06-06' }),
      makeMenu({ id: 2, date: '2026-06-05' }),
      makeMenu({ id: 1, date: '2026-06-04' }),
    ];
    (Menu.findOne as jest.Mock).mockResolvedValue(null);
    (Menu.create as jest.Mock).mockResolvedValue(menus[0]);
    const destroyMock = jest.fn();
    (Menu.findAll as jest.Mock).mockResolvedValue(
      menus.map((m) => ({ ...m, destroy: destroyMock })),
    );

    await menuService.upsert('2026-06-06', { breakfast: 'Queque' });

    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('propagates db errors', async () => {
    (Menu.findOne as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(menuService.upsert('2026-06-06', {})).rejects.toThrow('db error');
  });
});

describe('menuService.findByDate', () => {
  it('returns the menu for the given date', async () => {
    const menu = makeMenu();
    (Menu.findOne as jest.Mock).mockResolvedValue(menu);

    const result = await menuService.findByDate('2026-06-06');

    expect(result).toMatchObject({ date: '2026-06-06' });
  });

  it('returns null when no menu exists for the date', async () => {
    (Menu.findOne as jest.Mock).mockResolvedValue(null);

    const result = await menuService.findByDate('2026-06-06');

    expect(result).toBeNull();
  });
});

describe('menuService.findAll', () => {
  it('returns all stored menus ordered by date descending', async () => {
    const menus = [
      makeMenu({ id: 2, date: '2026-06-06' }),
      makeMenu({ id: 1, date: '2026-06-05' }),
    ];
    (Menu.findAll as jest.Mock).mockResolvedValue(menus);

    const result = await menuService.findAll();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ date: '2026-06-06' });
  });
});
