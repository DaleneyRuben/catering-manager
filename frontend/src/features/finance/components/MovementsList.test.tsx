import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  },
  {
    kind: 'expense',
    id: 'E1',
    date: '2026-08-04',
    amount: 180,
    label: 'Transporte',
    description: 'Reparto del día',
  },
];

const setup = (props: Partial<React.ComponentProps<typeof MovementsList>> = {}) => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onDuplicate = jest.fn();
  render(
    <MovementsList
      movements={movements}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      {...props}
    />,
  );
  return { onEdit, onDelete, onDuplicate };
};

describe('MovementsList', () => {
  it('describes an income row by the client who paid', () => {
    setup();

    const row = screen.getByTestId('movement-P1');
    expect(within(row).getByText('Marcela Ríos')).toBeInTheDocument();
    expect(within(row).getByText('Suscripción')).toBeInTheDocument();
    expect(within(row).getByText('+1.550')).toBeInTheDocument();
  });

  it('describes an expense row by its category and note', () => {
    setup();

    const row = screen.getByTestId('movement-E1');
    expect(within(row).getByText('Transporte')).toBeInTheDocument();
    expect(within(row).getByText('Reparto del día')).toBeInTheDocument();
    expect(within(row).getByText('−180')).toBeInTheDocument();
  });

  it('shows each movement dated day and month', () => {
    setup();

    expect(within(screen.getByTestId('movement-P1')).getByText('05/08')).toBeInTheDocument();
  });

  it('offers edit and delete on an expense', async () => {
    const { onEdit, onDelete } = setup();
    const row = screen.getByTestId('movement-E1');

    await userEvent.click(within(row).getByRole('button', { name: /editar/i }));
    await userEvent.click(within(row).getByRole('button', { name: /eliminar/i }));

    expect(onEdit).toHaveBeenCalledWith(movements[1]);
    expect(onDelete).toHaveBeenCalledWith(movements[1]);
  });

  // Duplicar is the primary entry path — delivery is paid daily — so it sits on the row itself
  // rather than behind an overflow menu.
  it('offers duplicate on an expense', async () => {
    const { onDuplicate } = setup();
    const row = screen.getByTestId('movement-E1');

    await userEvent.click(within(row).getByRole('button', { name: /duplicar/i }));

    expect(onDuplicate).toHaveBeenCalledWith(movements[1]);
  });

  it('orders the expense actions as edit, duplicate, delete', () => {
    setup();

    const labels = within(screen.getByTestId('movement-E1'))
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(labels).toEqual(['Editar', 'Duplicar', 'Eliminar']);
  });

  // Nothing on an income row is a human's to revise, and a disabled control would only invite
  // the question — so there is no affordance at all (ADR-008).
  it('offers no action at all on an income row', () => {
    setup();

    const row = screen.getByTestId('movement-P1');
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });

  it('reads as nothing yet rather than as an error when the month is empty', () => {
    setup({ movements: [] });

    expect(screen.getByText('Aún no hay movimientos')).toBeInTheDocument();
    expect(screen.queryByTestId('movement-P1')).not.toBeInTheDocument();
  });

  it('renders income and expenses in one list rather than two tabs', () => {
    setup();

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/^movement-/)).toHaveLength(2);
  });
});
