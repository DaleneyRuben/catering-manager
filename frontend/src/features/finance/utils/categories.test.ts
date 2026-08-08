import { categoryAddedMessage } from '@/features/finance/utils/categories';
import type { ExpenseCategory } from '@/features/finance/types';

const catalog: ExpenseCategory[] = [
  { id: 'AB12CD', name: 'Insumos', active: true },
  { id: 'EF34GH', name: 'Eventos', active: false },
];

describe('categoryAddedMessage', () => {
  it('reports a name nothing answered to as created', () => {
    expect(
      categoryAddedMessage({ id: 'IJ56KL', name: 'Mantenimiento', active: true }, catalog),
    ).toBe('Categoría «Mantenimiento» creada');
  });

  // A duplicate name folds onto the category that already answers to it rather than erroring, so
  // "creada" would describe something that did not happen.
  it('reports a fold onto an active category as already existing', () => {
    expect(categoryAddedMessage({ id: 'AB12CD', name: 'Insumos', active: true }, catalog)).toBe(
      'Ya existe la categoría «Insumos»',
    );
  });

  // Folding onto an archived one restores it, which is a third outcome and reads as neither of the
  // other two.
  it('reports a fold onto an archived category as a restore', () => {
    expect(categoryAddedMessage({ id: 'EF34GH', name: 'Eventos', active: true }, catalog)).toBe(
      'Categoría «Eventos» restaurada',
    );
  });
});
