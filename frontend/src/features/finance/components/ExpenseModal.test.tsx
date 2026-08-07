import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseModal } from '@/features/finance/components/ExpenseModal';
import type { ExpenseCategory } from '@/features/finance/types';

const categories: ExpenseCategory[] = [
  { id: 'CAT1', name: 'Insumos', active: true },
  { id: 'CAT2', name: 'Transporte', active: true },
];

const setup = (props: Partial<React.ComponentProps<typeof ExpenseModal>> = {}) => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  render(
    <ExpenseModal
      categories={categories}
      today="2026-08-06"
      onSubmit={onSubmit}
      onClose={onClose}
      {...props}
    />,
  );
  return { onSubmit, onClose };
};

describe('ExpenseModal', () => {
  it('registers an expense', async () => {
    const { onSubmit } = setup();

    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    await userEvent.selectOptions(screen.getByLabelText(/categoría/i), 'CAT2');
    await userEvent.type(screen.getByLabelText(/descripción/i), 'Reparto del día');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      amount: 180,
      categoryId: 'CAT2',
      spentAt: '2026-08-06',
      description: 'Reparto del día',
    });
  });

  it('dates a new expense today', () => {
    setup();

    expect(screen.getByLabelText(/fecha/i)).toHaveValue('2026-08-06');
  });

  // Money that has not moved yet is not a movement — the register is cash basis.
  it('does not allow a future date', () => {
    setup();

    expect(screen.getByLabelText(/fecha/i)).toHaveAttribute('max', '2026-08-06');
  });

  it('refuses to submit an amount of zero', async () => {
    const { onSubmit } = setup();

    await userEvent.type(screen.getByLabelText(/monto/i), '0');

    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses to submit with no amount at all', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled();
  });

  it('sends no description when the field is left empty', async () => {
    const { onSubmit } = setup();

    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
  });

  // This form is filled every single day, so it is built for speed.
  it('lands focus on the amount', () => {
    setup();

    expect(screen.getByLabelText(/monto/i)).toHaveFocus();
  });

  it('submits on Enter', async () => {
    const { onSubmit } = setup();

    await userEvent.type(screen.getByLabelText(/monto/i), '180{Enter}');

    expect(onSubmit).toHaveBeenCalled();
  });

  it('edits an existing expense', async () => {
    const { onSubmit } = setup({
      expense: {
        id: 'E1',
        amount: 180,
        categoryId: 'CAT2',
        spentAt: '2026-08-04',
        description: 'Reparto del día',
      },
    });

    expect(screen.getByLabelText(/monto/i)).toHaveValue('180');
    expect(screen.getByLabelText(/categoría/i)).toHaveValue('CAT2');
    expect(screen.getByLabelText(/fecha/i)).toHaveValue('2026-08-04');

    await userEvent.clear(screen.getByLabelText(/monto/i));
    await userEvent.type(screen.getByLabelText(/monto/i), '200');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 200 }));
  });

  it('titles itself for the mode it is in', () => {
    setup();
    expect(screen.getByText('Registrar gasto')).toBeInTheDocument();
  });

  describe('duplicating an expense', () => {
    const source = {
      id: 'E1',
      amount: 180,
      categoryId: 'CAT2',
      spentAt: '2026-07-30',
      description: 'Reparto del día',
    };

    it('carries the amount, category and description across', () => {
      setup({ duplicateOf: source });

      expect(screen.getByLabelText(/monto/i)).toHaveValue('180');
      expect(screen.getByLabelText(/categoría/i)).toHaveValue('CAT2');
      expect(screen.getByLabelText(/descripción/i)).toHaveValue('Reparto del día');
    });

    // The daily delivery payment is the reason this exists: same expense, today's date.
    it('dates the copy today rather than carrying the original date', () => {
      setup({ duplicateOf: source });

      expect(screen.getByLabelText(/fecha/i)).toHaveValue('2026-08-06');
    });

    // A duplicate creates; it never edits the row it was copied from.
    it('stays in create mode', async () => {
      const { onSubmit } = setup({ duplicateOf: source });

      expect(screen.getByText('Registrar gasto')).toBeInTheDocument();
      expect(screen.queryByText('Editar gasto')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

      expect(onSubmit).toHaveBeenCalledWith({
        amount: 180,
        categoryId: 'CAT2',
        spentAt: '2026-08-06',
        description: 'Reparto del día',
      });
    });

    it('is still editable before confirming', async () => {
      const { onSubmit } = setup({ duplicateOf: source });

      await userEvent.clear(screen.getByLabelText(/monto/i));
      await userEvent.type(screen.getByLabelText(/monto/i), '220');
      await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 220 }));
    });
  });

  it('closes without submitting', async () => {
    const { onClose, onSubmit } = setup();

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
