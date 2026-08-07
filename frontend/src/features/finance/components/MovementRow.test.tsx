import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MovementRow } from '@/features/finance/components/MovementRow';
import type { Movement } from '@/features/finance/types';

const income: Movement = {
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
};

const expense: Movement = {
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
};

const setup = (movement: Movement) => {
  const onEdit = jest.fn();
  const onDuplicate = jest.fn();
  const onDelete = jest.fn();
  render(
    <MemoryRouter>
      <MovementRow
        movement={movement}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </MemoryRouter>,
  );
  return { onEdit, onDuplicate, onDelete };
};

const openActions = () => userEvent.click(screen.getByRole('button', { name: /acciones/i }));

describe('MovementRow', () => {
  it('reads an income row as the client who paid', () => {
    setup(income);

    expect(screen.getByText('Suscripción')).toBeInTheDocument();
    expect(screen.getByText('+1.550')).toBeInTheDocument();
    expect(screen.getByText('05/08')).toBeInTheDocument();
  });

  // The client's name is the link, so going to their profile reads as a property of the row's
  // subject rather than a fourth action competing with the expense controls.
  it('takes an income row to the client who paid it', () => {
    setup(income);

    expect(screen.getByRole('link', { name: 'Marcela Ríos' })).toHaveAttribute(
      'href',
      '/clientes/C1',
    );
  });

  // The register keeps counting a deleted client's payments, so the row stays — but it must not
  // offer a link to a profile that no longer exists.
  it('marks a deleted client instead of linking nowhere', () => {
    setup({ ...income, clientArchived: true });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Marcela Ríos')).toBeInTheDocument();
    expect(screen.getByText('Cliente archivado')).toBeInTheDocument();
  });

  it('reads an expense row as its note, tagged with the category it was filed against', () => {
    setup(expense);

    expect(screen.getByText('Reparto del día')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.getByText('−180')).toBeInTheDocument();
  });

  it('falls back to the category as the title when an expense carries no note', () => {
    setup({ ...expense, description: null });

    expect(screen.getAllByText('Transporte')).toHaveLength(2);
  });

  // A 7px dot carried the whole distinction in v1; a directional glyph and a tinted row make the
  // two kinds legible in a long interleaved list.
  it('points the glyph in the direction the money moved', () => {
    setup(income);
    expect(screen.getByTitle('Ingreso')).toBeInTheDocument();
  });

  it('points an expense glyph the other way', () => {
    setup(expense);
    expect(screen.getByTitle('Gasto')).toBeInTheDocument();
  });

  it('tints the income row so it separates from the expenses around it', () => {
    setup(income);

    expect(screen.getByTestId('movement-P1')).toHaveClass('bg-income-row-bg');
  });

  // The v1 actions appeared on hover only: invisible on touch, tabbed blind by keyboard. One
  // always-present trigger replaces them without turning a long list into a wall of buttons.
  it('offers the expense actions without needing a hover', () => {
    setup(expense);

    expect(screen.getByRole('button', { name: /acciones/i })).toBeInTheDocument();
  });

  it('opens edit, duplicate and delete from that one trigger', async () => {
    const { onEdit, onDuplicate, onDelete } = setup(expense);

    await openActions();
    await userEvent.click(screen.getByText('Editar'));
    expect(onEdit).toHaveBeenCalledWith(expense);

    await openActions();
    await userEvent.click(screen.getByText('Duplicar con la fecha de hoy'));
    expect(onDuplicate).toHaveBeenCalledWith(expense);

    await openActions();
    await userEvent.click(screen.getByText('Eliminar'));
    expect(onDelete).toHaveBeenCalledWith(expense);
  });

  // Nothing on an income row is a human's to revise (ADR-008).
  it('offers no actions at all on an income row', () => {
    setup(income);

    expect(screen.queryByRole('button', { name: /acciones/i })).not.toBeInTheDocument();
  });

  it('names who registered the movement on either kind of row', () => {
    setup(expense);
    expect(screen.getByRole('button', { name: /gilian roca/i })).toBeInTheDocument();
  });

  it('rounds off the last row, which no longer has a rule under it', () => {
    render(
      <MemoryRouter>
        <MovementRow
          movement={expense}
          isLast
          onEdit={jest.fn()}
          onDuplicate={jest.fn()}
          onDelete={jest.fn()}
        />
      </MemoryRouter>,
    );

    const row = screen.getByTestId('movement-E1');
    expect(row).toHaveClass('rounded-b-[12px]');
    expect(row).not.toHaveClass('border-b');
  });
});

describe('MovementRow provenance', () => {
  it('opens the who chip without disturbing the row actions', async () => {
    setup(expense);

    await userEvent.click(screen.getByRole('button', { name: /gilian roca/i }));

    expect(screen.getByText('Registrado por')).toBeInTheDocument();
    expect(within(screen.getByTestId('movement-E1')).getByText('Gilian Roca')).toBeInTheDocument();
  });
});
