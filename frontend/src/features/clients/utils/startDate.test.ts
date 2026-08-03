import { checkIsWeekend } from '@/utils/devFlags';
import { isWeekendStartDate } from './startDate';

jest.mock('@/utils/devFlags', () => ({ checkIsWeekend: jest.fn() }));

describe('isWeekendStartDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defers to checkIsWeekend so the bypass flag applies', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(false);

    expect(isWeekendStartDate('2026-08-01')).toBe(false);
    expect(checkIsWeekend).toHaveBeenCalledWith(new Date(2026, 7, 1));
  });

  it('reports a weekend when checkIsWeekend does', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);

    expect(isWeekendStartDate('2026-08-01')).toBe(true);
  });

  it('treats an empty date as not a weekend so it never blocks on its own', () => {
    expect(isWeekendStartDate('')).toBe(false);
    expect(checkIsWeekend).not.toHaveBeenCalled();
  });
});
