import Menu from '../../../models/Menu';
import { findByDate } from '../find-by-date';

jest.mock('../../../models/Menu');

beforeEach(() => jest.clearAllMocks());

describe('findByDate', () => {
  it('returns the menu for the given date', async () => {
    const menu = { id: 1, date: '2026-06-16' };
    (Menu.findOne as jest.Mock).mockResolvedValue(menu);

    const result = await findByDate('2026-06-16');

    expect(result).toMatchObject({ date: '2026-06-16' });
  });

  it('returns null when no menu exists for the date', async () => {
    (Menu.findOne as jest.Mock).mockResolvedValue(null);

    const result = await findByDate('2026-06-16');

    expect(result).toBeNull();
  });
});
