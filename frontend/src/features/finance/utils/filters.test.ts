import {
  filterCategoryOptions,
  hasActiveFilters,
  noMatchHint,
} from '@/features/finance/utils/filters';
import type { CategoryTotal, ExpenseCategory, MovementFilters } from '@/features/finance/types';

const NONE: MovementFilters = { q: '', direction: 'all', categoryId: '' };

const catalogue: ExpenseCategory[] = [
  { id: 'A', name: 'Insumos', active: true },
  { id: 'B', name: 'Alquiler', active: true },
];

const spent = (categoryId: string, categoryName: string, active: boolean): CategoryTotal => ({
  categoryId,
  categoryName,
  total: 100,
  active,
});

describe('hasActiveFilters', () => {
  it('is false when nothing narrows the list', () => {
    expect(hasActiveFilters(NONE)).toBe(false);
  });

  it('is true for a direction, a category or a term', () => {
    expect(hasActiveFilters({ ...NONE, direction: 'income' })).toBe(true);
    expect(hasActiveFilters({ ...NONE, categoryId: 'A' })).toBe(true);
    expect(hasActiveFilters({ ...NONE, q: 'verdulería' })).toBe(true);
  });

  it('does not count a term of only whitespace', () => {
    expect(hasActiveFilters({ ...NONE, q: '   ' })).toBe(false);
  });
});

describe('filterCategoryOptions', () => {
  it('opens with an option that narrows nothing', () => {
    expect(filterCategoryOptions(catalogue, [])[0]).toEqual({
      id: '',
      label: 'Todas las categorías',
    });
  });

  it('lists the active categories alphabetically', () => {
    expect(filterCategoryOptions(catalogue, []).map((o) => o.label)).toEqual([
      'Todas las categorías',
      'Alquiler',
      'Insumos',
    ]);
  });

  // A category archived after the month was spent still owns that money. Dropping it from the
  // select would leave rows on screen that no filter can reach.
  it('keeps an archived category that was spent this month, and says so', () => {
    const options = filterCategoryOptions(catalogue, [spent('C', 'Eventos', false)]);

    expect(options.map((o) => o.label)).toContain('Eventos (archivada)');
  });

  it('leaves out an archived category with nothing spent this month', () => {
    const withArchived = [...catalogue, { id: 'C', name: 'Eventos', active: false }];

    expect(filterCategoryOptions(withArchived, []).map((o) => o.id)).toEqual(['', 'B', 'A']);
  });

  it('lists a category once even when it was both catalogued and spent', () => {
    const options = filterCategoryOptions(catalogue, [spent('A', 'Insumos', true)]);

    expect(options.filter((o) => o.id === 'A')).toHaveLength(1);
  });
});

describe('noMatchHint', () => {
  // The count is the month's, not the filtered list's — the point of the sentence is that there
  // is something here, just not this.
  it('names how many movements the month really holds', () => {
    expect(noMatchHint(12, '2026-08', { ...NONE, direction: 'income' })).toContain(
      'Hay 12 movimientos en agosto 2026',
    );
  });

  it('speaks of a single movement in the singular', () => {
    expect(noMatchHint(1, '2026-08', { ...NONE, direction: 'income' })).toContain(
      'Hay 1 movimiento en agosto 2026',
    );
  });

  it('suggests another word when a term is what narrowed the list', () => {
    expect(noMatchHint(12, '2026-08', { ...NONE, q: 'verdulería' })).toContain(
      'Prueba con otra palabra.',
    );
  });

  it('suggests both when a term and a filter are active', () => {
    expect(
      noMatchHint(12, '2026-08', { q: 'verdulería', direction: 'expense', categoryId: '' }),
    ).toContain('Prueba con otra palabra o con otro filtro.');
  });

  it('suggests another filter when only a filter is active', () => {
    expect(noMatchHint(12, '2026-08', { ...NONE, categoryId: 'A' })).toContain(
      'Prueba con otro filtro.',
    );
  });
});
