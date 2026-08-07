import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MovementsList } from '@/features/finance/components/MovementsList';
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

const setup = (props: Partial<React.ComponentProps<typeof MovementsList>> = {}) => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onDuplicate = jest.fn();
  render(
    <MemoryRouter>
      <MovementsList
        movements={movements}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onEdit, onDelete, onDuplicate };
};

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
    setup({ movements: [] });

    expect(screen.getByText('Aún no hay movimientos')).toBeInTheDocument();
    expect(screen.queryByTestId('movement-P1')).not.toBeInTheDocument();
  });
});
