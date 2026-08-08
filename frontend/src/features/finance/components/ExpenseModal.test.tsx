import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseModal } from '@/features/finance/components/ExpenseModal';
import { useCategoryMutations } from '@/features/finance/hooks/useCategories';
import type { ExpenseCategory } from '@/features/finance/types';

// The chip row reaches the API to add a category; nothing else in this form does.
jest.mock('@/features/finance/hooks/useCategories');

const mockMutations = useCategoryMutations as jest.MockedFunction<typeof useCategoryMutations>;

const categories: ExpenseCategory[] = [
  { id: 'CAT1', name: 'Insumos', active: true },
  { id: 'CAT2', name: 'Transporte', active: true },
];

beforeEach(() => {
  mockMutations.mockReturnValue({
    create: jest.fn(),
    rename: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
    isSaving: false,
  });
});

const pickCategory = (name: string) => userEvent.click(screen.getByRole('button', { name }));

const setup = (props: Partial<React.ComponentProps<typeof ExpenseModal>> = {}) => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  // `categories` comes last so a rerender can replace the catalog the props opened with.
  const ui = (catalog: ExpenseCategory[]) => (
    <ExpenseModal
      today="2026-08-06"
      onSubmit={onSubmit}
      onClose={onClose}
      {...props}
      categories={catalog}
    />
  );
  const { rerender } = render(ui(props.categories ?? categories));

  return {
    onSubmit,
    onClose,
    rerender: (catalog: ExpenseCategory[]) => rerender(ui(catalog)),
  };
};

describe('ExpenseModal', () => {
  it('registers an expense', async () => {
    const { onSubmit } = setup();

    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    await pickCategory('Transporte');
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

  // The labels already say what each field is, so a placeholder only adds noise to a form filled
  // from muscle memory (backlog 3.22).
  it('prompts with nothing inside the fields', () => {
    setup();

    expect(screen.getByLabelText(/monto/i)).not.toHaveAttribute('placeholder');
    expect(screen.getByLabelText(/descripción/i)).not.toHaveAttribute('placeholder');
  });

  // Both behaviours stay; only the caption goes, replaced by a glyph on the button itself. It is
  // decorative, so it stays out of the button's accessible name.
  it('states Enter as a glyph on the button rather than a caption', () => {
    setup();

    expect(screen.queryByText('Enter para guardar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar' })).toContainElement(
      screen.getByText('↵'),
    );
  });

  // One click on a visible list, no select to open (backlog 3.23).
  it('offers the categories as chips instead of a select', () => {
    setup();

    expect(screen.getByRole('group', { name: 'Categoría' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  // The server ranks the catalog by use this month, so the first chip is the likeliest answer.
  it('starts on the first category the server ranked', async () => {
    const { onSubmit } = setup();

    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'CAT1' }));
  });

  // The catalog can still be in flight when the form opens, so the fallback cannot be a one-time
  // seed of the initial state.
  it('falls back to the first category once the catalog arrives', async () => {
    const { onSubmit, rerender } = setup({ categories: [] });

    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled();

    rerender(categories);
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'CAT1' }));
  });

  // The remembered default is a convenience, not a record: once that category is archived it stops
  // being offered, and a new expense must not be quietly filed against it.
  it('forgets a remembered category that has since been archived', async () => {
    const { onSubmit } = setup({
      categories: [
        { id: 'CAT1', name: 'Insumos', active: true },
        { id: 'CAT9', name: 'Eventos', active: false },
      ],
      defaultCategoryId: 'CAT9',
    });

    expect(screen.queryByRole('button', { name: 'Eventos' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'CAT1' }));
  });

  it('still opens on a remembered category that is offered', async () => {
    const { onSubmit } = setup({ defaultCategoryId: 'CAT2' });

    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'CAT2' }));
  });

  // An edit is different: the row was filed against that category, so it keeps naming it.
  it('keeps an archived category on an expense already filed against it', () => {
    setup({
      categories: [
        { id: 'CAT1', name: 'Insumos', active: true },
        { id: 'CAT9', name: 'Eventos', active: false },
      ],
      expense: {
        id: 'E1',
        amount: 180,
        categoryId: 'CAT9',
        spentAt: '2026-08-04',
        description: null,
      },
    });

    expect(screen.getByRole('button', { name: 'Eventos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('files the expense against the chip picked last', async () => {
    const { onSubmit } = setup();

    await userEvent.type(screen.getByLabelText(/monto/i), '180');
    await pickCategory('Transporte');
    await pickCategory('Insumos');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'CAT1' }));
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
    expect(screen.getByRole('button', { name: 'Transporte' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
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
      expect(screen.getByRole('button', { name: 'Transporte' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
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
