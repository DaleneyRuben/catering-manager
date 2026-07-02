import { Op } from 'sequelize';
import Menu from '../../../models/Menu';
import { upsert } from '../upsert';

jest.mock('../../../models/Menu');
jest.mock('../../../utils/date', () => ({
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

describe('upsert', () => {
  it('creates a new menu when none exists for the date', async () => {
    (Menu.findOne as jest.Mock).mockResolvedValue(null);
    const created = makeMenu();
    (Menu.create as jest.Mock).mockResolvedValue(created);
    (Menu.destroy as jest.Mock).mockResolvedValue(undefined);

    const result = await upsert('2026-06-16', { breakfast: 'Queque de platano' });

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

    const result = await upsert('2026-06-16', { breakfast: 'New dish' });

    expect(mockInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ breakfast: 'New dish' }),
    );
    expect(result).toMatchObject({ breakfast: 'New dish' });
  });

  it('prunes menus outside the current week after upsert', async () => {
    (Menu.findOne as jest.Mock).mockResolvedValue(null);
    (Menu.create as jest.Mock).mockResolvedValue(makeMenu());
    (Menu.destroy as jest.Mock).mockResolvedValue(undefined);

    await upsert('2026-06-16', { breakfast: 'Queque' });

    expect(Menu.destroy).toHaveBeenCalledWith({
      where: {
        date: { [Op.notBetween]: ['2026-06-15', '2026-06-19'] },
      },
    });
  });

  it('propagates db errors', async () => {
    (Menu.findOne as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(upsert('2026-06-16', {})).rejects.toThrow('db error');
  });
});
