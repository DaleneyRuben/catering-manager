import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryManagerRow } from '@/features/finance/components/CategoryManagerRow';
import type { ExpenseCategoryWithUsage } from '@/features/finance/types';

const category: ExpenseCategoryWithUsage = {
  id: 'AB12CD',
  name: 'Insumos',
  active: true,
  usageThisMonth: 5,
  usageAllTime: 41,
};

const onRename = jest.fn().mockResolvedValue(undefined);
const onArchive = jest.fn();
const onRestore = jest.fn();

const setup = (overrides: Partial<ExpenseCategoryWithUsage> = {}) =>
  render(
    <CategoryManagerRow
      category={{ ...category, ...overrides }}
      onRename={onRename}
      onArchive={onArchive}
      onRestore={onRestore}
    />,
  );

beforeEach(() => jest.clearAllMocks());

describe('CategoryManagerRow', () => {
  // The row states its own usage so nobody has to guess what archiving would affect.
  it('counts this month when the category was used this month', () => {
    setup();

    expect(screen.getByTestId('category-usage')).toHaveTextContent('5 gastos este mes');
  });

  it('falls back to the all-time count when nothing was spent this month', () => {
    setup({ usageThisMonth: 0, usageAllTime: 12 });

    expect(screen.getByTestId('category-usage')).toHaveTextContent('12 gastos en el historial');
  });

  it('says a category has never been used at all', () => {
    setup({ usageThisMonth: 0, usageAllTime: 0 });

    expect(screen.getByTestId('category-usage')).toHaveTextContent('Sin uso');
  });

  it('reads a single expense in the singular', () => {
    setup({ usageThisMonth: 1, usageAllTime: 1 });
    expect(screen.getByTestId('category-usage')).toHaveTextContent('1 gasto este mes');

    setup({ usageThisMonth: 0, usageAllTime: 1 });
    expect(screen.getAllByTestId('category-usage')[1]).toHaveTextContent('1 gasto en el historial');
  });

  it('offers Renombrar and Archivar on an active category', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Renombrar Insumos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archivar Insumos' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restaurar/i })).not.toBeInTheDocument();
  });

  // Retiring must be reversible, so an archived category stays visible and carries the way back.
  it('offers only Restaurar on an archived category', async () => {
    setup({ active: false });

    expect(screen.queryByRole('button', { name: /renombrar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /archivar/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar Insumos' }));

    expect(onRestore).toHaveBeenCalledWith('AB12CD');
  });

  // Archiving is the modal's business, not the row's: it needs the month's arithmetic to state
  // what stays put before anyone confirms.
  it('reports the intent to archive rather than archiving', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Archivar Insumos' }));

    expect(onArchive).toHaveBeenCalledWith(expect.objectContaining({ id: 'AB12CD' }));
  });

  it('swaps the row for an input seeded with the current name', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Insumos' }));

    const input = screen.getByLabelText('Nuevo nombre');
    expect(input).toHaveValue('Insumos');
    expect(input).toHaveFocus();
  });

  it('saves the corrected name', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Insumos' }));
    await userEvent.clear(screen.getByLabelText('Nuevo nombre'));
    await userEvent.type(screen.getByLabelText('Nuevo nombre'), 'Insumos secos{Enter}');

    expect(onRename).toHaveBeenCalledWith('AB12CD', 'Insumos secos');
  });

  it('leaves the name alone when the edit is cancelled', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Insumos' }));
    await userEvent.type(screen.getByLabelText('Nuevo nombre'), ' secos');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Insumos')).toBeInTheDocument();
  });

  // Re-submitting the name it already has is not a correction, so it closes quietly rather than
  // reporting that the historial was updated.
  it('asks for nothing when the name did not change', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Insumos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Nuevo nombre')).not.toBeInTheDocument();
  });

  it('refuses to save an empty name', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Insumos' }));
    await userEvent.clear(screen.getByLabelText('Nuevo nombre'));

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  // A name already taken comes back as a 409, whose message the user has to be able to act on —
  // so the input stays open with what they typed still in it.
  it('stays open when the rename is rejected', async () => {
    onRename.mockRejectedValueOnce(new Error('Ya existe una categoría con ese nombre'));
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Insumos' }));
    await userEvent.type(screen.getByLabelText('Nuevo nombre'), ' secos{Enter}');

    expect(screen.getByLabelText('Nuevo nombre')).toHaveValue('Insumos secos');
  });

  it('closes the input once the rename lands', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Insumos' }));
    await userEvent.type(screen.getByLabelText('Nuevo nombre'), ' secos{Enter}');

    expect(screen.queryByLabelText('Nuevo nombre')).not.toBeInTheDocument();
  });
});
