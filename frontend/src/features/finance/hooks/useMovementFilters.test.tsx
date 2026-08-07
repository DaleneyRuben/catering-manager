import { act, renderHook } from '@testing-library/react';
import { useMovementFilters } from '@/features/finance/hooks/useMovementFilters';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const settle = () => act(() => jest.runAllTimers());

describe('useMovementFilters', () => {
  it('starts with nothing narrowed', () => {
    const { result } = renderHook(() => useMovementFilters());

    expect(result.current.filters).toEqual({ q: '', direction: 'all', categoryId: '' });
    expect(result.current.hasAny).toBe(false);
  });

  it('reports that a filter is active', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.setDirection('expense'));

    expect(result.current.hasAny).toBe(true);
  });

  // Income carries no category, so the two controls would contradict each other. The prototype
  // resolves it by clearing the category rather than by refusing the click.
  it('clears the category when the list narrows to income', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.pickCategory('AB12CD'));
    act(() => result.current.setDirection('income'));

    expect(result.current.filters.categoryId).toBe('');
    expect(result.current.filters.direction).toBe('income');
  });

  it('keeps the category when the list narrows to expenses', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.pickCategory('AB12CD'));
    act(() => result.current.setDirection('expense'));

    expect(result.current.filters.categoryId).toBe('AB12CD');
  });

  // Picking a category is an expenses-only question, so it moves the direction with it instead of
  // leaving a filter that reads as "todos" while showing only gastos.
  it('narrows to expenses when a category is picked', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.pickCategory('AB12CD'));

    expect(result.current.filters).toMatchObject({ direction: 'expense', categoryId: 'AB12CD' });
  });

  it('clears the category when the one already picked is picked again', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.pickCategory('AB12CD'));
    act(() => result.current.pickCategory('AB12CD'));

    expect(result.current.filters.categoryId).toBe('');
  });

  // Clicking the same category twice is a way back out, not a way back to "todos" — the direction
  // the user is left looking at is the one they were already reading.
  it('leaves the direction alone when a category is cleared by picking it again', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.pickCategory('AB12CD'));
    act(() => result.current.pickCategory('AB12CD'));

    expect(result.current.filters.direction).toBe('expense');
  });

  // "Todas las categorías" is the select's way of saying no category, and it must not drag the
  // direction to Gastos on its way out.
  it('clears the category without narrowing the direction', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.pickCategory('AB12CD'));
    act(() => result.current.setDirection('all'));
    act(() => result.current.pickCategory(''));

    expect(result.current.filters).toEqual({ q: '', direction: 'all', categoryId: '' });
  });

  it('clears everything at once', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.setQuery('verdulería'));
    act(() => result.current.pickCategory('AB12CD'));
    act(() => result.current.clearAll());

    expect(result.current.filters).toEqual({ q: '', direction: 'all', categoryId: '' });
    expect(result.current.hasAny).toBe(false);
  });

  it('shows the typed term straight away', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.setQuery('verd'));

    expect(result.current.filters.q).toBe('verd');
  });

  // The field must not fire a request per keystroke: the register is fetched whole, and "verdulería"
  // would be ten of them.
  it('holds the term back from the query until typing settles', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.setQuery('verd'));
    expect(result.current.queryFilters.q).toBe('');

    settle();
    expect(result.current.queryFilters.q).toBe('verd');
  });

  it('passes the other filters through to the query immediately', () => {
    const { result } = renderHook(() => useMovementFilters());

    act(() => result.current.pickCategory('AB12CD'));

    expect(result.current.queryFilters).toMatchObject({
      direction: 'expense',
      categoryId: 'AB12CD',
    });
  });
});
