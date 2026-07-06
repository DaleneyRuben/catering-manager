import { renderHook, act } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import { checkIsWeekend } from '@/utils/devFlags';
import { useDaySelector } from './useDaySelector';

jest.mock('@/utils/devFlags', () => ({
  checkIsWeekend: jest.fn(),
}));

describe('useDaySelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkIsWeekend as jest.Mock).mockReturnValue(false);
  });

  it('defaults to today', () => {
    const { result } = renderHook(() => useDaySelector());
    expect(format(result.current.resolvedDate, 'yyyy-MM-dd')).toBe(
      format(new Date(), 'yyyy-MM-dd'),
    );
    expect(result.current.selected).toBe('today');
  });

  it('resolves to tomorrow after selecting tomorrow', () => {
    const { result } = renderHook(() => useDaySelector());
    act(() => result.current.setSelected('tomorrow'));
    expect(format(result.current.resolvedDate, 'yyyy-MM-dd')).toBe(
      format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    );
  });

  it('formats the short dd/MM label for a given option', () => {
    const { result } = renderHook(() => useDaySelector());
    expect(result.current.shortDateForOption('today')).toBe(format(new Date(), 'dd/MM'));
    expect(result.current.shortDateForOption('tomorrow')).toBe(
      format(addDays(new Date(), 1), 'dd/MM'),
    );
  });

  it('reflects checkIsWeekend for the resolved date', () => {
    (checkIsWeekend as jest.Mock).mockReturnValue(true);
    const { result } = renderHook(() => useDaySelector());
    expect(result.current.isWeekend).toBe(true);
  });
});
