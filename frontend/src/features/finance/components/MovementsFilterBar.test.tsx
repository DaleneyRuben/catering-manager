import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovementsFilterBar } from '@/features/finance/components/MovementsFilterBar';
import type { FilterBarProps } from '@/features/finance/components/MovementsFilterBar';
import type { MovementFilters } from '@/features/finance/types';

const NONE: MovementFilters = { q: '', direction: 'all', categoryId: '' };

const onQueryChange = jest.fn();
const onDirectionChange = jest.fn();
const onCategoryChange = jest.fn();
const onClearAll = jest.fn();

const props = (overrides: Partial<FilterBarProps> = {}): FilterBarProps => ({
  filters: NONE,
  categories: [
    { id: 'A', name: 'Insumos', active: true },
    { id: 'B', name: 'Transporte', active: true },
  ],
  byCategory: [],
  count: 21,
  subtotal: 13350,
  onQueryChange,
  onDirectionChange,
  onCategoryChange,
  onClearAll,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('MovementsFilterBar', () => {
  it('heads the list', () => {
    render(<MovementsFilterBar {...props()} />);

    expect(screen.getByRole('heading', { name: 'Movimientos' })).toBeInTheDocument();
  });

  it('reports what is typed into the search field', async () => {
    render(<MovementsFilterBar {...props()} />);

    await userEvent.type(screen.getByLabelText(/buscar por descripción o cliente/i), 'v');

    expect(onQueryChange).toHaveBeenCalledWith('v');
  });

  // The box carries no visible label, so the placeholder is what names it.
  it('names the search box on its face', () => {
    render(<MovementsFilterBar {...props()} />);

    expect(screen.getByPlaceholderText('Buscar')).toBeInTheDocument();
  });

  it('offers no way to clear an empty search field', () => {
    render(<MovementsFilterBar {...props()} />);

    expect(screen.queryByRole('button', { name: /limpiar búsqueda/i })).not.toBeInTheDocument();
  });

  it('clears the search field', async () => {
    render(<MovementsFilterBar {...props({ filters: { ...NONE, q: 'verdulería' } })} />);

    await userEvent.click(screen.getByRole('button', { name: /limpiar búsqueda/i }));

    expect(onQueryChange).toHaveBeenCalledWith('');
  });

  it('narrows to one side of the register', async () => {
    render(<MovementsFilterBar {...props()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Gastos' }));

    expect(onDirectionChange).toHaveBeenCalledWith('expense');
  });

  it('marks which side is being shown', () => {
    render(<MovementsFilterBar {...props({ filters: { ...NONE, direction: 'income' } })} />);

    expect(screen.getByRole('button', { name: 'Ingresos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('narrows to a category', async () => {
    render(<MovementsFilterBar {...props()} />);

    await userEvent.selectOptions(screen.getByLabelText(/filtrar por categoría/i), 'A');

    expect(onCategoryChange).toHaveBeenCalledWith('A');
  });

  // Income carries no category. The contradiction is resolved by taking the control away and
  // saying why, rather than by leaving a select that answers with nothing.
  it('replaces the category select with a note while showing income', () => {
    render(<MovementsFilterBar {...props({ filters: { ...NONE, direction: 'income' } })} />);

    expect(screen.queryByLabelText(/filtrar por categoría/i)).not.toBeInTheDocument();
    expect(screen.getByText('Los ingresos no llevan categoría')).toBeInTheDocument();
  });

  it('states the sort order while nothing is filtered', () => {
    render(<MovementsFilterBar {...props()} />);

    expect(screen.getByText('Más reciente primero')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /limpiar todo/i })).not.toBeInTheDocument();
  });

  it('shows each active filter as a chip that removes it', async () => {
    render(
      <MovementsFilterBar
        {...props({ filters: { q: 'verdulería', direction: 'expense', categoryId: 'A' } })}
      />,
    );

    expect(screen.queryByText('Más reciente primero')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /solo gastos/i }));
    expect(onDirectionChange).toHaveBeenCalledWith('all');

    await userEvent.click(screen.getByRole('button', { name: /quitar categoría insumos/i }));
    expect(onCategoryChange).toHaveBeenCalledWith('');

    await userEvent.click(screen.getByRole('button', { name: /quitar búsqueda/i }));
    expect(onQueryChange).toHaveBeenCalledWith('');
  });

  it('clears every filter at once', async () => {
    render(<MovementsFilterBar {...props({ filters: { ...NONE, direction: 'expense' } })} />);

    await userEvent.click(screen.getByRole('button', { name: /limpiar todo/i }));

    expect(onClearAll).toHaveBeenCalled();
  });

  // With nothing filtered the figure is the month's balance, which is what lets the tiles above
  // stay fixed while the list moves.
  it('labels the unfiltered figure as the month itself', () => {
    render(<MovementsFilterBar {...props()} />);

    expect(screen.getByText('Neto del mes')).toBeInTheDocument();
    expect(screen.getByText('21 movimientos')).toBeInTheDocument();
    expect(screen.getByText('+13.350')).toBeInTheDocument();
  });

  it('labels the filtered figure a subtotal', () => {
    render(
      <MovementsFilterBar
        {...props({ filters: { ...NONE, direction: 'expense' }, count: 4, subtotal: -1200 })}
      />,
    );

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('4 movimientos')).toBeInTheDocument();
    expect(screen.getByText('−1.200')).toBeInTheDocument();
  });

  it('counts a single movement in the singular', () => {
    render(<MovementsFilterBar {...props({ count: 1 })} />);

    expect(screen.getByText('1 movimiento')).toBeInTheDocument();
  });
});
