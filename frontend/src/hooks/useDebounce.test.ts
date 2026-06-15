import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello'));
    expect(result.current).toBe('hello');
  });

  it('does not update before the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'first' },
    });
    rerender({ v: 'second' });
    act(() => jest.advanceTimersByTime(299));
    expect(result.current).toBe('first');
  });

  it('updates after the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'first' },
    });
    rerender({ v: 'second' });
    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('second');
  });

  it('resets the timer when value changes before delay elapses', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'first' },
    });
    rerender({ v: 'second' });
    act(() => jest.advanceTimersByTime(200));
    rerender({ v: 'third' });
    act(() => jest.advanceTimersByTime(299));
    expect(result.current).toBe('first');
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('third');
  });

  it('works with a custom delay', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 1000), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    act(() => jest.advanceTimersByTime(999));
    expect(result.current).toBe('a');
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('b');
  });
});
