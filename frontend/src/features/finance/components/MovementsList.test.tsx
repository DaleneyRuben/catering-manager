import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MovementsList } from '@/features/finance/components/MovementsList';
import type { FilterBarProps } from '@/features/finance/components/MovementsFilterBar';
import type { Movement } from '@/features/finance/types';

const movements: Movement[] = [
  {
    kind: 'income',
    id: 'P1',
    date: '2026-08-05',
    amount: 1550,
    label: 'Marcela Ríos',
    description: null,
    clientId: 'C1',
    clientArchived: false,
    categoryId: null,
    registeredByName: 'Daleney Ruben',
    registeredAt: '2026-08-05T13:30:00.000Z',
  },
  {
    kind: 'expense',
    id: 'E1',
    date: '2026-08-04',
    amount: 180,
    label: 'Transporte',
    description: 'Reparto del día',
    clientId: null,
    clientArchived: false,
    categoryId: 'K1',
    registeredByName: 'Gilian Roca',
    registeredAt: '2026-08-04T18:05:00.000Z',
  },
];

const onClearAll = jest.fn();

const filters: FilterBarProps = {
  filters: { q: '', direction: 'all', categoryId: '' },
  categories: [{ id: 'K1', name: 'Transporte', active: true }],
  byCategory: [],
  count: 2,
  subtotal: 1370,
  onQueryChange: jest.fn(),
  onDirectionChange: jest.fn(),
  onCategoryChange: jest.fn(),
  onClearAll,
};

const setup = (props: Partial<React.ComponentProps<typeof MovementsList>> = {}) => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onDuplicate = jest.fn();
  render(
    <MemoryRouter>
      <MovementsList
        movements={movements}
        filters={filters}
        month="2026-08"
        monthCount={2}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onEdit, onDelete, onDuplicate };
};

beforeEach(() => jest.clearAllMocks());

describe('MovementsList', () => {
  it('heads the list and states its order', () => {
    setup();

    expect(screen.getByText('Movimientos')).toBeInTheDocument();
    expect(screen.getByText('Más reciente primero')).toBeInTheDocument();
  });

  it('renders income and expenses in one list rather than two tabs', () => {
    setup();

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/^movement-/)).toHaveLength(2);
  });

  it('describes an income row by the client who paid', () => {
    setup();

    const row = screen.getByTestId('movement-P1');
    expect(within(row).getByText('Marcela Ríos')).toBeInTheDocument();
    expect(within(row).getByText('+1.550')).toBeInTheDocument();
  });

  it('carries a row action through to the caller', async () => {
    const { onDelete } = setup();
    const row = screen.getByTestId('movement-E1');

    await userEvent.click(within(row).getByRole('button', { name: /acciones/i }));
    await userEvent.click(screen.getByText('Eliminar'));

    expect(onDelete).toHaveBeenCalledWith(movements[1]);
  });

  // The card no longer clips its contents — a row's action menu has to escape it — so the last
  // row carries the rounded corner the card used to.
  it('marks the last row so it can round off the card', () => {
    setup();

    expect(screen.getByTestId('movement-E1')).toHaveClass('rounded-b-[12px]');
    expect(screen.getByTestId('movement-P1')).not.toHaveClass('rounded-b-[12px]');
  });

  it('reads as nothing yet rather than as an error when the month is empty', () => {
    setup({ movements: [], monthCount: 0, filters: { ...filters, count: 0, subtotal: 0 } });

    expect(screen.getByText('Aún no hay movimientos')).toBeInTheDocument();
    expect(screen.queryByTestId('movement-P1')).not.toBeInTheDocument();
  });

  it('teaches where income comes from on an empty month', () => {
    setup({ movements: [], monthCount: 0, filters: { ...filters, count: 0, subtotal: 0 } });

    expect(
      screen.getByText(/los ingresos aparecen al marcar una suscripción como pagada/i),
    ).toBeInTheDocument();
  });

  // An empty month and a filter that matched nothing are different statements. Saying "aún no hay
  // movimientos" over a month holding twelve of them would read as data loss.
  it('says the filter matched nothing, and how much the month really holds', () => {
    setup({
      movements: [],
      monthCount: 12,
      filters: {
        ...filters,
        count: 0,
        subtotal: 0,
        filters: { q: '', direction: 'income', categoryId: '' },
      },
    });

    expect(screen.getByText('Ningún movimiento coincide')).toBeInTheDocument();
    expect(screen.queryByText('Aún no hay movimientos')).not.toBeInTheDocument();
    expect(screen.getByText(/hay 12 movimientos en agosto 2026/i)).toBeInTheDocument();
  });

  it('offers a way out of a filter that matched nothing', async () => {
    setup({
      movements: [],
      monthCount: 12,
      filters: {
        ...filters,
        count: 0,
        subtotal: 0,
        filters: { q: '', direction: 'income', categoryId: '' },
      },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onClearAll).toHaveBeenCalled();
  });
});
