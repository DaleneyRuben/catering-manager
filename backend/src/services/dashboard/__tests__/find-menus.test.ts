import { findByDate } from '../../menu/find-by-date';
import { findMenus } from '../find-menus';

jest.mock('../../menu/find-by-date', () => ({
  findByDate: jest.fn(),
}));

const mockAppToday = jest.fn(() => '2026-06-25');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => mockAppToday(),
}));

const fullMenu = {
  breakfast: 'Avena',
  morningSnack: 'Fruta',
  salad: 'Ensalada',
  lunch: 'Pollo',
  afternoonSnack: 'Yogurt',
  dinner: 'Sopa',
  juice: 'Limonada',
};

describe('findMenus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks loaded true when all 7 meal fields are filled', async () => {
    (findByDate as jest.Mock).mockResolvedValue(fullMenu);

    const result = await findMenus();

    expect(result.today.loaded).toBe(true);
  });

  it('marks loaded false when any meal field is missing', async () => {
    (findByDate as jest.Mock).mockResolvedValue({ ...fullMenu, dinner: null });

    const result = await findMenus();

    expect(result.today.loaded).toBe(false);
  });

  it('marks loaded false when no menu exists for the date', async () => {
    (findByDate as jest.Mock).mockResolvedValue(null);

    const result = await findMenus();

    expect(result.today.loaded).toBe(false);
    expect(result.tomorrow.loaded).toBe(false);
  });

  it('includes the date for each day', async () => {
    (findByDate as jest.Mock).mockResolvedValue(null);

    const result = await findMenus();

    expect(result.today.date).toBe('2026-06-25');
    expect(result.tomorrow.date).toBe('2026-06-26');
  });

  it('returns monday and tuesday dates when today is saturday', async () => {
    mockAppToday.mockReturnValueOnce('2026-06-27');
    (findByDate as jest.Mock).mockResolvedValue(null);

    const result = await findMenus();

    expect(result.today.date).toBe('2026-06-29');
    expect(result.tomorrow.date).toBe('2026-06-30');
  });
});
