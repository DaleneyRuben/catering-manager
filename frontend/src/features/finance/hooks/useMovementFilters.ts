import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { MovementFilters } from '@/features/finance/types';

const NONE: MovementFilters = { q: '', direction: 'all', categoryId: '' };

const SEARCH_DEBOUNCE_MS = 550;

// The two controls can contradict each other — income carries no category — so the rules that keep
// them consistent live here rather than in the bar that renders them, and the same rules apply
// however the filter was set: from the select, from a category cell, or from a row's tag.
//
// Filters deliberately outlive a month change: comparing one category across months is exactly
// why someone narrows the list in the first place.
export function useMovementFilters() {
  const [filters, setFilters] = useState<MovementFilters>(NONE);

  const setQuery = useCallback((q: string) => setFilters((f) => ({ ...f, q })), []);

  const setDirection = useCallback(
    (direction: MovementFilters['direction']) =>
      setFilters((f) => ({
        ...f,
        direction,
        // Resolved by clearing the category, not by refusing the click.
        categoryId: direction === 'income' ? '' : f.categoryId,
      })),
    [],
  );

  const pickCategory = useCallback(
    (categoryId: string) =>
      setFilters((f) => {
        // Picking the category already showing — or "Todas las categorías" from the select — is
        // the way back out of it. The direction stays where it is: it is what the user has been
        // reading, and dragging it to Gastos on the way out would be a filter nobody asked for.
        if (!categoryId || f.categoryId === categoryId) return { ...f, categoryId: '' };
        return { ...f, categoryId, direction: 'expense' };
      }),
    [],
  );

  const clearAll = useCallback(() => setFilters(NONE), []);

  // Typed straight into the controls, held back from the request: the register is fetched whole,
  // and one round trip per keystroke of "verdulería" is ten of them.
  //
  // Longer than the shared 300ms default, which fires between words rather than after them: the
  // list emptied out mid-term and the empty state flashed up while the user was still typing.
  const debouncedQuery = useDebounce(filters.q, SEARCH_DEBOUNCE_MS);

  const queryFilters = useMemo<MovementFilters>(
    () => ({ ...filters, q: debouncedQuery }),
    [filters, debouncedQuery],
  );

  const hasAny =
    filters.direction !== 'all' || filters.categoryId !== '' || filters.q.trim() !== '';

  return { filters, queryFilters, hasAny, setQuery, setDirection, pickCategory, clearAll };
}
